from flask import Blueprint, jsonify
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query

meta_bp = Blueprint("meta", __name__)


@meta_bp.route("/seasons", methods=["GET"])
def get_seasons():
    """Return all seasons available in the database."""
    seasons = query(
        "SELECT DISTINCT season, COUNT(*) as match_count FROM matches WHERE season > 0 GROUP BY season ORDER BY season DESC"
    )
    return jsonify([dict(s) for s in seasons])


@meta_bp.route("/stats", methods=["GET"])
def get_stats():
    """Return high-level database stats."""
    stats = query("""
        SELECT
            (SELECT COUNT(*) FROM matches) as total_matches,
            (SELECT COUNT(DISTINCT season) FROM matches WHERE season > 0) as total_seasons,
            (SELECT COUNT(DISTINCT name) FROM players) as total_players,
            (SELECT COUNT(*) FROM deliveries) as total_deliveries,
            (SELECT MIN(season) FROM matches WHERE season > 0) as first_season,
            (SELECT MAX(season) FROM matches WHERE season > 0) as latest_season
    """, one=True)
    return jsonify(dict(stats) if stats else {})


@meta_bp.route("/top-players", methods=["GET"])
def top_players():
    """All-time top batters across all seasons."""
    players = query("""
        SELECT d.batter,
               p.team,
               p.role,
               SUM(d.runs_batter) as total_runs,
               COUNT(DISTINCT d.match_id) as matches,
               ROUND(SUM(d.runs_batter)*100.0/NULLIF(COUNT(*),0),2) as career_sr,
               SUM(CASE WHEN d.runs_batter=4 THEN 1 ELSE 0 END) as fours,
               SUM(CASE WHEN d.runs_batter=6 THEN 1 ELSE 0 END) as sixes
        FROM deliveries d
        LEFT JOIN players p ON d.batter = p.name
        GROUP BY d.batter
        HAVING COUNT(*) > 30
        ORDER BY total_runs DESC
        LIMIT 20
    """)
    return jsonify([dict(p) for p in players])
