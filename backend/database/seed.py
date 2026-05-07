"""
Seed script — loads 5 IPL 2023 matches with realistic ball-by-ball data.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database.db import get_connection, init_db

PLAYERS = [
    ("Virat Kohli", "Royal Challengers Bangalore", "batsman", "Right-hand bat", None, "Indian"),
    ("Rohit Sharma", "Mumbai Indians", "batsman", "Right-hand bat", "Right-arm off-break", "Indian"),
    ("MS Dhoni", "Chennai Super Kings", "wk-batsman", "Right-hand bat", "Right-arm medium", "Indian"),
    ("Hardik Pandya", "Gujarat Titans", "all-rounder", "Right-hand bat", "Right-arm fast-medium", "Indian"),
    ("Rashid Khan", "Gujarat Titans", "bowler", "Right-hand bat", "Right-arm leg-spin", "Afghan"),
    ("Jasprit Bumrah", "Mumbai Indians", "bowler", "Right-hand bat", "Right-arm fast", "Indian"),
    ("Shubman Gill", "Gujarat Titans", "batsman", "Right-hand bat", None, "Indian"),
    ("KL Rahul", "Lucknow Super Giants", "wk-batsman", "Right-hand bat", None, "Indian"),
    ("Faf du Plessis", "Royal Challengers Bangalore", "batsman", "Right-hand bat", "Right-arm medium", "South African"),
    ("Mohammed Siraj", "Royal Challengers Bangalore", "bowler", "Right-hand bat", "Right-arm fast-medium", "Indian"),
]

MATCHES = [
    # (date, venue, team1, team2, toss_winner, toss_decision, winner, result_margin, season, match_number)
    ("2023-04-01", "MA Chidambaram Stadium, Chennai", "Chennai Super Kings", "Gujarat Titans", "Chennai Super Kings", "bat", "Gujarat Titans", "5 wickets", 2023, 1),
    ("2023-04-02", "Wankhede Stadium, Mumbai", "Punjab Kings", "Royal Challengers Bangalore", "Royal Challengers Bangalore", "field", "Royal Challengers Bangalore", "24 runs", 2023, 2),
    ("2023-04-03", "Rajiv Gandhi Intl. Cricket Stadium, Hyderabad", "Sunrisers Hyderabad", "Rajasthan Royals", "Rajasthan Royals", "field", "Rajasthan Royals", "72 runs", 2023, 3),
    ("2023-04-04", "Eden Gardens, Kolkata", "Kolkata Knight Riders", "Royal Challengers Bangalore", "Kolkata Knight Riders", "bat", "Kolkata Knight Riders", "81 runs", 2023, 4),
    ("2023-04-05", "Narendra Modi Stadium, Ahmedabad", "Gujarat Titans", "Mumbai Indians", "Gujarat Titans", "bat", "Gujarat Titans", "6 wickets", 2023, 5),
]

# Realistic ball-by-ball data: (over, ball, batter, bowler, runs_batter, runs_extras, wicket_kind, dismissed, shot_zone)
DELIVERIES_TEMPLATE = [
    # Over 1
    (1,1,"Virat Kohli","Jasprit Bumrah",0,0,None,None,"cover"),
    (1,2,"Virat Kohli","Jasprit Bumrah",4,0,None,None,"off"),
    (1,3,"Virat Kohli","Jasprit Bumrah",0,0,None,None,"mid-off"),
    (1,4,"Faf du Plessis","Jasprit Bumrah",1,0,None,None,"mid-on"),
    (1,5,"Virat Kohli","Jasprit Bumrah",0,0,None,None,"point"),
    (1,6,"Virat Kohli","Jasprit Bumrah",6,0,None,None,"mid-wicket"),
    # Over 2
    (2,1,"Virat Kohli","Mohammed Siraj",2,0,None,None,"off"),
    (2,2,"Faf du Plessis","Mohammed Siraj",4,0,None,None,"cover"),
    (2,3,"Faf du Plessis","Mohammed Siraj",0,0,None,None,"fine-leg"),
    (2,4,"Faf du Plessis","Mohammed Siraj",1,0,None,None,"mid-on"),
    (2,5,"Virat Kohli","Mohammed Siraj",0,1,None,None,"cover"),
    (2,6,"Virat Kohli","Mohammed Siraj",4,0,None,None,"point"),
    # Over 3
    (3,1,"Virat Kohli","Rashid Khan",0,0,None,None,"off"),
    (3,2,"Virat Kohli","Rashid Khan",1,0,None,None,"mid-off"),
    (3,3,"Faf du Plessis","Rashid Khan",0,0,None,None,"cover"),
    (3,4,"Faf du Plessis","Rashid Khan",4,0,None,None,"off"),
    (3,5,"Faf du Plessis","Rashid Khan",0,0,"caught","Faf du Plessis","off"),
    (3,6,"KL Rahul","Rashid Khan",1,0,None,None,"mid-on"),
    # Over 4
    (4,1,"Virat Kohli","Hardik Pandya",6,0,None,None,"mid-wicket"),
    (4,2,"Virat Kohli","Hardik Pandya",4,0,None,None,"cover"),
    (4,3,"KL Rahul","Hardik Pandya",2,0,None,None,"off"),
    (4,4,"KL Rahul","Hardik Pandya",0,0,None,None,"point"),
    (4,5,"KL Rahul","Hardik Pandya",1,0,None,None,"mid-on"),
    (4,6,"Virat Kohli","Hardik Pandya",0,0,"bowled","Virat Kohli","off"),
    # Over 5
    (5,1,"MS Dhoni","Jasprit Bumrah",0,0,None,None,"cover"),
    (5,2,"MS Dhoni","Jasprit Bumrah",4,0,None,None,"fine-leg"),
    (5,3,"MS Dhoni","Jasprit Bumrah",6,0,None,None,"mid-wicket"),
    (5,4,"KL Rahul","Jasprit Bumrah",1,0,None,None,"off"),
    (5,5,"MS Dhoni","Jasprit Bumrah",0,0,None,None,"point"),
    (5,6,"MS Dhoni","Jasprit Bumrah",4,0,None,None,"off"),
    # Over 6
    (6,1,"MS Dhoni","Rashid Khan",2,0,None,None,"mid-on"),
    (6,2,"MS Dhoni","Rashid Khan",0,0,None,None,"off"),
    (6,3,"KL Rahul","Rashid Khan",4,0,None,None,"cover"),
    (6,4,"KL Rahul","Rashid Khan",0,0,"lbw","KL Rahul","off"),
    (6,5,"Shubman Gill","Rashid Khan",1,0,None,None,"mid-on"),
    (6,6,"MS Dhoni","Rashid Khan",6,0,None,None,"mid-wicket"),
    # Over 7
    (7,1,"MS Dhoni","Mohammed Siraj",4,0,None,None,"cover"),
    (7,2,"MS Dhoni","Mohammed Siraj",0,0,None,None,"point"),
    (7,3,"Shubman Gill","Mohammed Siraj",2,0,None,None,"off"),
    (7,4,"Shubman Gill","Mohammed Siraj",4,0,None,None,"mid-off"),
    (7,5,"MS Dhoni","Mohammed Siraj",1,0,None,None,"fine-leg"),
    (7,6,"MS Dhoni","Mohammed Siraj",6,0,None,None,"mid-wicket"),
    # Over 8
    (8,1,"Shubman Gill","Hardik Pandya",0,0,None,None,"cover"),
    (8,2,"Shubman Gill","Hardik Pandya",4,0,None,None,"off"),
    (8,3,"MS Dhoni","Hardik Pandya",2,0,None,None,"fine-leg"),
    (8,4,"MS Dhoni","Hardik Pandya",0,0,"caught","MS Dhoni","cover"),
    (8,5,"Rohit Sharma","Hardik Pandya",6,0,None,None,"mid-wicket"),
    (8,6,"Rohit Sharma","Hardik Pandya",4,0,None,None,"cover"),
    # Over 9
    (9,1,"Rohit Sharma","Jasprit Bumrah",0,0,None,None,"point"),
    (9,2,"Rohit Sharma","Jasprit Bumrah",1,0,None,None,"mid-on"),
    (9,3,"Shubman Gill","Jasprit Bumrah",4,0,None,None,"cover"),
    (9,4,"Shubman Gill","Jasprit Bumrah",6,0,None,None,"mid-wicket"),
    (9,5,"Shubman Gill","Jasprit Bumrah",0,0,"caught","Shubman Gill","off"),
    (9,6,"Hardik Pandya","Jasprit Bumrah",2,0,None,None,"fine-leg"),
    # Over 10
    (10,1,"Rohit Sharma","Rashid Khan",4,0,None,None,"cover"),
    (10,2,"Rohit Sharma","Rashid Khan",6,0,None,None,"mid-on"),
    (10,3,"Hardik Pandya","Rashid Khan",1,0,None,None,"off"),
    (10,4,"Rohit Sharma","Rashid Khan",0,0,None,None,"point"),
    (10,5,"Rohit Sharma","Rashid Khan",4,0,None,None,"off"),
    (10,6,"Hardik Pandya","Rashid Khan",2,0,None,None,"mid-on"),
]


def seed():
    init_db()
    conn = get_connection()

    # Clear existing seed data
    conn.execute("DELETE FROM deliveries")
    conn.execute("DELETE FROM innings")
    conn.execute("DELETE FROM matches")
    conn.execute("DELETE FROM players")
    conn.execute("DELETE FROM watchlist")
    conn.execute("DELETE FROM users")
    conn.commit()

    # Insert players
    for p in PLAYERS:
        conn.execute(
            "INSERT OR IGNORE INTO players (name, team, role, batting_style, bowling_style, nationality) VALUES (?,?,?,?,?,?)",
            p
        )

    # Insert matches + innings + deliveries
    for match_data in MATCHES:
        cur = conn.execute(
            "INSERT INTO matches (match_date, venue, team1, team2, toss_winner, toss_decision, winner, result_margin, season, match_number) VALUES (?,?,?,?,?,?,?,?,?,?)",
            match_data
        )
        match_id = cur.lastrowid

        # Innings 1
        inn_cur = conn.execute(
            "INSERT INTO innings (match_id, innings_number, batting_team, bowling_team) VALUES (?,?,?,?)",
            (match_id, 1, match_data[2], match_data[3])
        )
        innings_id = inn_cur.lastrowid

        total_runs = 0
        total_wickets = 0

        for d in DELIVERIES_TEMPLATE:
            over, ball, batter, bowler, runs_b, runs_e, wkt_kind, dismissed, zone = d
            total_runs += runs_b + runs_e
            if wkt_kind:
                total_wickets += 1
            conn.execute(
                """INSERT INTO deliveries
                   (match_id, innings_id, over_number, ball_number, batter, bowler,
                    runs_batter, runs_extras, runs_total, wicket_kind, player_dismissed, shot_zone)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (match_id, innings_id, over, ball, batter, bowler,
                 runs_b, runs_e, runs_b + runs_e, wkt_kind, dismissed, zone)
            )

        conn.execute(
            "UPDATE innings SET total_runs=?, total_wickets=?, total_overs=10 WHERE id=?",
            (total_runs, total_wickets, innings_id)
        )

        # Innings 2 (chasing team scores target - 10 to simulate a win)
        inn2_cur = conn.execute(
            "INSERT INTO innings (match_id, innings_number, batting_team, bowling_team) VALUES (?,?,?,?)",
            (match_id, 2, match_data[3], match_data[2])
        )
        innings2_id = inn2_cur.lastrowid
        conn.execute(
            "UPDATE innings SET total_runs=?, total_wickets=4, total_overs=9.4 WHERE id=?",
            (total_runs + 10, innings2_id)
        )

    conn.commit()
    conn.close()
    print("[SEED] 5 IPL 2023 matches seeded successfully.")
    print("[SEED] 10 players seeded.")


if __name__ == "__main__":
    seed()
