"""
SportsMassive — Full Cricsheet IPL Data Downloader + Ingester
=====================================================================
Downloads ALL IPL matches from Cricsheet (ball-by-ball CSV format),
extracts the ZIP, and ingests every match into the SQLite database.

Usage:
    python download_and_ingest.py

The script will:
1. Download ipl_csv2.zip from cricsheet.org (~80MB)
2. Extract to backend/data/cricsheet_ipl/
3. Drop & recreate the database with proper indexes
4. Ingest all matches
5. Print a summary

Requirements: pip install requests (already included in requirements.txt)
"""

import os
import sys
import zipfile
import urllib.request
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from database.db import get_connection, init_db

CRICSHEET_URL = "https://cricsheet.org/downloads/ipl_csv2.zip"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "cricsheet_ipl")
ZIP_PATH = os.path.join(os.path.dirname(__file__), "data", "ipl_csv2.zip")


def download_with_progress(url: str, dest: str):
    """Download file with a simple progress bar."""
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"[DOWNLOAD] Fetching: {url}")

    def reporthook(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(downloaded / total_size * 100, 100)
            mb_done = downloaded / 1_048_576
            mb_total = total_size / 1_048_576
            print(f"\r  {pct:.1f}%  {mb_done:.1f} MB / {mb_total:.1f} MB", end="", flush=True)

    urllib.request.urlretrieve(url, dest, reporthook)
    print()  # newline after progress
    print(f"[DOWNLOAD] Saved to: {dest}")


def extract_zip(zip_path: str, extract_to: str):
    """Extract ZIP file."""
    print(f"[EXTRACT] Extracting to: {extract_to}")
    os.makedirs(extract_to, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(extract_to)
    print("[EXTRACT] Done.")


def add_indexes(conn):
    """Add performance indexes for the large dataset."""
    print("[DB] Creating performance indexes...")
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_deliveries_batter ON deliveries(batter)",
        "CREATE INDEX IF NOT EXISTS idx_deliveries_bowler ON deliveries(bowler)",
        "CREATE INDEX IF NOT EXISTS idx_deliveries_match_id ON deliveries(match_id)",
        "CREATE INDEX IF NOT EXISTS idx_deliveries_innings_id ON deliveries(innings_id)",
        "CREATE INDEX IF NOT EXISTS idx_deliveries_over ON deliveries(over_number)",
        "CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season)",
        "CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date)",
        "CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(team1, team2)",
        "CREATE INDEX IF NOT EXISTS idx_innings_match ON innings(match_id)",
        "CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id)",
    ]
    for sql in indexes:
        conn.execute(sql)
    conn.commit()
    print("[DB] Indexes created.")


def clear_match_data(conn):
    """Clear old match data while preserving users and watchlists."""
    print("[DB] Clearing old match/innings/delivery data...")
    conn.execute("DELETE FROM deliveries")
    conn.execute("DELETE FROM innings")
    conn.execute("DELETE FROM matches")
    conn.execute("DELETE FROM players")
    conn.commit()
    print("[DB] Cleared.")


def normalize_team_name(name: str) -> str:
    """Normalize historical team name variations."""
    mappings = {
        "Delhi Daredevils": "Delhi Capitals",
        "Deccan Chargers": "Sunrisers Hyderabad",
        "Kochi Tuskers Kerala": "Kochi Tuskers Kerala",
        "Pune Warriors": "Pune Warriors India",
        "Rising Pune Supergiant": "Rising Pune Supergiants",
        "Rising Pune Supergiants": "Rising Pune Supergiants",
    }
    return mappings.get(name, name)


def ingest_all(folder_path: str):
    """Parse all Cricsheet CSVs and load into database."""
    import csv
    import glob

    csv_files = glob.glob(os.path.join(folder_path, "*.csv"))
    # Skip the "info" file if it exists
    csv_files = [f for f in csv_files if not os.path.basename(f).startswith("README")]
    
    print(f"[INGEST] Found {len(csv_files)} match files.")

    conn = get_connection()
    conn.execute("PRAGMA journal_mode=WAL")  # faster writes
    conn.execute("PRAGMA synchronous=NORMAL")

    clear_match_data(conn)

    processed = 0
    skipped = 0
    player_registry = {}  # name → (team, role)

    start = time.time()

    for filepath in csv_files:
        try:
            result = _parse_match(conn, filepath, player_registry)
            if result:
                processed += 1
            else:
                skipped += 1
        except Exception as e:
            skipped += 1

        if processed % 100 == 0 and processed > 0:
            elapsed = time.time() - start
            rate = processed / elapsed
            remaining = (len(csv_files) - processed) / max(rate, 0.1)
            print(f"  [{processed}/{len(csv_files)}] ~{remaining:.0f}s remaining...", end="\r")

    # Bulk-insert players
    print("\n[INGEST] Registering players...")
    for name, info in player_registry.items():
        conn.execute(
            "INSERT OR IGNORE INTO players (name, team, role, nationality) VALUES (?,?,?,?)",
            (name, info.get("team"), _guess_role(info.get("bowling_count", 0), info.get("batting_count", 0)), "Unknown")
        )

    conn.commit()
    add_indexes(conn)
    conn.close()

    elapsed = time.time() - start
    print(f"\n[INGEST] Complete!")
    print(f"  Matches imported : {processed}")
    print(f"  Matches skipped  : {skipped}")
    print(f"  Time taken       : {elapsed:.1f}s")
    print(f"  Players found    : {len(player_registry)}")


def _guess_role(bowling_count: int, batting_count: int) -> str:
    if bowling_count > 20 and batting_count > 20:
        return "all-rounder"
    if bowling_count > 20:
        return "bowler"
    return "batsman"


def _parse_match(conn, filepath: str, player_registry: dict) -> bool:
    """Parse one Cricsheet CSV file. Returns True on success."""
    import csv

    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        return False

    first = rows[0]

    # Only process IPL (season field contains year ≥ 2008)
    season_raw = first.get("season", "")
    try:
        season = int(str(season_raw).split("/")[0])  # handles "2007/08" format
    except (ValueError, AttributeError):
        season = 0

    if season < 2008:
        return False

    team1 = normalize_team_name(first.get("team1", ""))
    team2 = normalize_team_name(first.get("team2", ""))
    winner = normalize_team_name(first.get("winner", ""))
    toss_winner = normalize_team_name(first.get("toss_winner", ""))

    match_date = first.get("start_date", first.get("date", ""))
    venue = first.get("venue", "")
    toss_decision = first.get("toss_decision", "")
    result_margin = first.get("result_margin", "") + " " + first.get("result", "")

    match_num_raw = first.get("match_number", first.get("event_match_number", "0"))
    try:
        match_num = int(match_num_raw) if match_num_raw and match_num_raw != "nan" else 0
    except (ValueError, TypeError):
        match_num = 0

    cur = conn.execute(
        """INSERT OR IGNORE INTO matches
           (match_date, venue, team1, team2, toss_winner, toss_decision,
            winner, result_margin, season, match_number)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (match_date, venue, team1, team2, toss_winner, toss_decision,
         winner, result_margin.strip(), season, match_num)
    )
    match_id = cur.lastrowid
    if not match_id:
        return False  # Duplicate

    innings_map = {}  # innings_num → innings_id

    for row in rows:
        innings_raw = row.get("innings", "1")
        try:
            innings_num = int(float(innings_raw))
        except (ValueError, TypeError):
            innings_num = 1

        batting_team = normalize_team_name(row.get("batting_team", ""))
        bowling_team = normalize_team_name(row.get("bowling_team", ""))

        if innings_num not in innings_map:
            inn_cur = conn.execute(
                "INSERT INTO innings (match_id, innings_number, batting_team, bowling_team) VALUES (?,?,?,?)",
                (match_id, innings_num, batting_team, bowling_team)
            )
            innings_map[innings_num] = inn_cur.lastrowid

        innings_id = innings_map[innings_num]

        # Over/ball
        over_raw = row.get("ball", row.get("over", "0"))
        try:
            over_float = float(over_raw)
            over_num = int(over_float)
            ball_num = round((over_float - over_num) * 10)
        except (ValueError, TypeError):
            over_num, ball_num = 0, 0

        batter = row.get("striker", row.get("batter", ""))
        bowler = row.get("bowler", "")
        non_striker = row.get("non_striker", "")

        runs_batter = int(row.get("runs_off_bat", 0) or 0)
        runs_extras = int(row.get("extras", 0) or 0)

        wicket_kind = row.get("wicket_type", "") or None
        player_dismissed = row.get("player_dismissed", "") or None
        extras_type = row.get("extras_type", "") or None

        # Track players
        for p in [batter, non_striker]:
            if p and p not in player_registry:
                player_registry[p] = {"batting_count": 0, "bowling_count": 0, "team": batting_team}
            if p:
                player_registry[p]["batting_count"] = player_registry[p].get("batting_count", 0) + 1
                player_registry[p]["team"] = batting_team  # update to most recent team

        if bowler:
            if bowler not in player_registry:
                player_registry[bowler] = {"batting_count": 0, "bowling_count": 0, "team": bowling_team}
            player_registry[bowler]["bowling_count"] = player_registry[bowler].get("bowling_count", 0) + 1
            player_registry[bowler]["team"] = bowling_team

        conn.execute(
            """INSERT INTO deliveries
               (match_id, innings_id, over_number, ball_number, batter, bowler, non_striker,
                runs_batter, runs_extras, runs_total, wicket_kind, player_dismissed, extras_type)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (match_id, innings_id, over_num, ball_num, batter, bowler, non_striker,
             runs_batter, runs_extras, runs_batter + runs_extras,
             wicket_kind if wicket_kind and wicket_kind.strip() else None,
             player_dismissed if player_dismissed and player_dismissed.strip() else None,
             extras_type if extras_type and extras_type.strip() else None)
        )

    # Update innings totals
    for innings_num, innings_id in innings_map.items():
        conn.execute("""
            UPDATE innings SET
                total_runs = (SELECT SUM(runs_total) FROM deliveries WHERE innings_id=?),
                total_wickets = (SELECT COUNT(*) FROM deliveries WHERE innings_id=? AND wicket_kind IS NOT NULL AND wicket_kind != 'run_out'),
                total_overs = (SELECT MAX(over_number) + 1.0 FROM deliveries WHERE innings_id=?)
            WHERE id=?
        """, (innings_id, innings_id, innings_id, innings_id))

    return True


if __name__ == "__main__":
    print("=" * 60)
    print("  SportsMassive — Cricsheet Full IPL Data Loader")
    print("=" * 60)

    # Step 1: Download
    if not os.path.exists(ZIP_PATH):
        download_with_progress(CRICSHEET_URL, ZIP_PATH)
    else:
        size_mb = os.path.getsize(ZIP_PATH) / 1_048_576
        print(f"[DOWNLOAD] ZIP already exists ({size_mb:.1f} MB). Using cached file.")
        print("           Delete data/ipl_csv2.zip to force re-download.")

    # Step 2: Extract
    if not os.path.exists(DATA_DIR) or not os.listdir(DATA_DIR):
        extract_zip(ZIP_PATH, DATA_DIR)
    else:
        csv_count = len([f for f in os.listdir(DATA_DIR) if f.endswith(".csv")])
        print(f"[EXTRACT] Data already extracted ({csv_count} files). Skipping extraction.")

    # Step 3: Init DB schema
    init_db()

    # Step 4: Ingest
    ingest_all(DATA_DIR)

    print("\n[DONE] Your SportsMassive database is ready with full IPL history!")
    print("       Restart python app.py to serve the updated data.\n")
