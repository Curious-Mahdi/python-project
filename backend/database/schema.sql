-- SportsMassive IPL Intelligence Platform
-- SQLite Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    team TEXT,
    role TEXT, -- batsman, bowler, all-rounder, wk-batsman
    batting_style TEXT,
    bowling_style TEXT,
    nationality TEXT DEFAULT 'Indian',
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_date TEXT,
    venue TEXT,
    team1 TEXT,
    team2 TEXT,
    toss_winner TEXT,
    toss_decision TEXT,
    winner TEXT,
    result_margin TEXT,
    season INTEGER,
    match_number INTEGER
);

CREATE TABLE IF NOT EXISTS innings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER REFERENCES matches(id),
    innings_number INTEGER, -- 1 or 2
    batting_team TEXT,
    bowling_team TEXT,
    total_runs INTEGER DEFAULT 0,
    total_wickets INTEGER DEFAULT 0,
    total_overs REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER REFERENCES matches(id),
    innings_id INTEGER REFERENCES innings(id),
    over_number INTEGER,
    ball_number INTEGER,
    batter TEXT,
    bowler TEXT,
    non_striker TEXT,
    runs_batter INTEGER DEFAULT 0,
    runs_extras INTEGER DEFAULT 0,
    runs_total INTEGER DEFAULT 0,
    wicket_kind TEXT, -- caught, bowled, lbw, run_out, stumped, etc.
    player_dismissed TEXT,
    fielder TEXT,
    extras_type TEXT, -- wide, no_ball, bye, leg_bye
    shot_zone TEXT -- off, mid-off, mid-on, on, fine-leg, point, cover, etc.
);

CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    player_name TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, player_name)
);
