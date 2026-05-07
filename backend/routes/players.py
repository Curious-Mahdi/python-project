from flask import Blueprint, jsonify, request
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query

players_bp = Blueprint("players", __name__)


@players_bp.route("/search", methods=["GET"])
def search_players():
    q = request.args.get("q", "")
    players = query(
        "SELECT name, team, role, batting_style, bowling_style, nationality FROM players WHERE name LIKE ? LIMIT 10",
        (f"%{q}%",)
    )
    return jsonify([dict(p) for p in players])


@players_bp.route("/<player_name>", methods=["GET"])
def player_stats(player_name):
    player = query("SELECT * FROM players WHERE name=?", (player_name,), one=True)
    if not player:
        return jsonify({"error": "Player not found"}), 404

    player_data = dict(player)

    # Career batting stats
    career_batting = query("""
        SELECT
            COUNT(*) as innings,
            SUM(runs_batter) as total_runs,
            MAX(runs_batter) as highest_score,
            ROUND(AVG(runs_batter), 2) as avg_per_ball,
            ROUND(SUM(runs_batter) * 100.0 / NULLIF(COUNT(*), 0), 2) as strike_rate,
            SUM(CASE WHEN runs_batter = 4 THEN 1 ELSE 0 END) as fours,
            SUM(CASE WHEN runs_batter = 6 THEN 1 ELSE 0 END) as sixes
        FROM deliveries WHERE batter=?
    """, (player_name,), one=True)

    # Career bowling stats
    career_bowling = query("""
        SELECT
            COUNT(DISTINCT match_id) as matches,
            COUNT(*) as balls_bowled,
            SUM(runs_total) as runs_conceded,
            COUNT(CASE WHEN wicket_kind IS NOT NULL AND wicket_kind != 'run_out' THEN 1 END) as wickets,
            ROUND(SUM(runs_total) * 6.0 / NULLIF(COUNT(*), 0), 2) as economy
        FROM deliveries WHERE bowler=?
    """, (player_name,), one=True)

    # Current season (2023) stats
    current_batting = query("""
        SELECT
            SUM(d.runs_batter) as season_runs,
            ROUND(SUM(d.runs_batter) * 100.0 / NULLIF(COUNT(*), 0), 2) as season_sr,
            SUM(CASE WHEN d.runs_batter = 4 THEN 1 ELSE 0 END) as season_fours,
            SUM(CASE WHEN d.runs_batter = 6 THEN 1 ELSE 0 END) as season_sixes
        FROM deliveries d
        JOIN matches m ON d.match_id = m.id
        WHERE d.batter=? AND m.season=2023
    """, (player_name,), one=True)

    current_bowling = query("""
        SELECT
            COUNT(CASE WHEN d.wicket_kind IS NOT NULL AND d.wicket_kind != 'run_out' THEN 1 END) as season_wickets,
            ROUND(SUM(d.runs_total) * 6.0 / NULLIF(COUNT(*), 0), 2) as season_economy
        FROM deliveries d
        JOIN matches m ON d.match_id = m.id
        WHERE d.bowler=? AND m.season=2023
    """, (player_name,), one=True)

    # Shot zone distribution
    shot_zones = query("""
        SELECT shot_zone, SUM(runs_batter) as runs, COUNT(*) as balls
        FROM deliveries WHERE batter=? AND shot_zone IS NOT NULL
        GROUP BY shot_zone
    """, (player_name,))

    return jsonify({
        "player": player_data,
        "career_batting": dict(career_batting) if career_batting else {},
        "career_bowling": dict(career_bowling) if career_bowling else {},
        "current_season_batting": dict(current_batting) if current_batting else {},
        "current_season_bowling": dict(current_bowling) if current_bowling else {},
        "shot_zones": [dict(z) for z in shot_zones],
    })
