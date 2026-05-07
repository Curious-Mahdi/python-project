"""
Cricsheet CSV Ingestion Pipeline
Usage: python parse_cricsheet.py --folder /path/to/cricsheet/ipl_csv2

Expects the Cricsheet "all_matches" CSV format.
"""
import csv
import os
import sys
import glob
import argparse
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database.db import get_connection, init_db


def parse_folder(folder_path: str):
    init_db()
    csv_files = glob.glob(os.path.join(folder_path, "*.csv"))
    print(f"[INGEST] Found {len(csv_files)} CSV files.")

    conn = get_connection()
    processed = 0

    for filepath in csv_files:
        try:
            _parse_single_match(conn, filepath)
            processed += 1
            if processed % 50 == 0:
                print(f"[INGEST] Processed {processed}/{len(csv_files)} matches...")
        except Exception as e:
            print(f"[INGEST] Error in {filepath}: {e}")

    conn.commit()
    conn.close()
    print(f"[INGEST] Done. {processed} matches imported.")


def _parse_single_match(conn, filepath: str):
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        return

    first = rows[0]

    # Insert match
    cur = conn.execute(
        """INSERT OR IGNORE INTO matches
           (match_date, venue, team1, team2, toss_winner, toss_decision, winner, season, match_number)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (
            first.get("start_date", ""),
            first.get("venue", ""),
            first.get("team1", ""),
            first.get("team2", ""),
            first.get("toss_winner", ""),
            first.get("toss_decision", ""),
            first.get("winner", ""),
            int(first.get("season", 0)) if first.get("season", "").isdigit() else 0,
            int(first.get("match_number", 0)) if first.get("match_number", "").isdigit() else 0,
        )
    )
    match_id = cur.lastrowid
    if not match_id:
        return  # Already exists

    innings_map = {}  # innings_number -> innings_id

    for row in rows:
        innings_num = int(row.get("innings", 1))
        batting_team = row.get("batting_team", "")
        bowling_team = row.get("bowling_team", "")

        if innings_num not in innings_map:
            inn_cur = conn.execute(
                "INSERT INTO innings (match_id, innings_number, batting_team, bowling_team) VALUES (?,?,?,?)",
                (match_id, innings_num, batting_team, bowling_team)
            )
            innings_map[innings_num] = inn_cur.lastrowid

        innings_id = innings_map[innings_num]

        # Parse over and ball
        over_str = row.get("over", "0")
        try:
            over_num = int(over_str)
        except ValueError:
            over_num = 0

        ball_str = row.get("ball", "0")
        try:
            ball_num = int(float(ball_str) * 10) % 10
        except ValueError:
            ball_num = 0

        runs_batter = int(row.get("runs_off_bat", 0) or 0)
        runs_extras = int(row.get("extras", 0) or 0)
        wicket_kind = row.get("wicket_type", "") or None
        player_dismissed = row.get("player_dismissed", "") or None

        conn.execute(
            """INSERT INTO deliveries
               (match_id, innings_id, over_number, ball_number, batter, bowler, non_striker,
                runs_batter, runs_extras, runs_total, wicket_kind, player_dismissed, extras_type)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                match_id, innings_id, over_num, ball_num,
                row.get("striker", ""), row.get("bowler", ""), row.get("non_striker", ""),
                runs_batter, runs_extras, runs_batter + runs_extras,
                wicket_kind, player_dismissed,
                row.get("extras_type", "") or None
            )
        )

    # Update innings totals
    for innings_num, innings_id in innings_map.items():
        conn.execute(
            """UPDATE innings SET
               total_runs = (SELECT SUM(runs_total) FROM deliveries WHERE innings_id=?),
               total_wickets = (SELECT COUNT(*) FROM deliveries WHERE innings_id=? AND wicket_kind IS NOT NULL)
               WHERE id=?""",
            (innings_id, innings_id, innings_id)
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Cricsheet IPL CSV data")
    parser.add_argument("--folder", required=True, help="Path to folder containing Cricsheet CSV files")
    args = parser.parse_args()
    parse_folder(args.folder)
