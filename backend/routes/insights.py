# insights.py
# Author: Rakhi
# Feature: Team & Venue Performance Insights API

from flask import Blueprint, jsonify, request
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query

insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/powerplay", methods=["GET"])
def best_powerplay_teams():
    try:
        results = query("""
            SELECT
                batting_team,
                ROUND(AVG(runs_total), 2) as avg_powerplay_runs,
                COUNT(DISTINCT match_id) as matches_played
            FROM deliveries
            WHERE over_number <= 6
            GROUP BY batting_team
            ORDER BY avg_powerplay_runs DESC
            LIMIT 5
        """)
        return jsonify([dict(r) for r in results])
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@insights_bp.route("/venues", methods=["GET"])
def top_venues():
    try:
        results = query("""
            SELECT
                m.venue,
                ROUND(AVG(d.runs_total), 2) as avg_runs_per_ball,
                COUNT(DISTINCT m.id) as total_matches
            FROM deliveries d
            JOIN matches m ON d.match_id = m.id
            GROUP BY m.venue
            ORDER BY avg_runs_per_ball DESC
            LIMIT 5
        """)
        return jsonify([dict(r) for r in results])
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@insights_bp.route("/consistent-batsmen", methods=["GET"])
def consistent_batsmen():
    try:
        season = request.args.get("season", 2023, type=int)
        results = query("""
            SELECT
                d.batter,
                COUNT(DISTINCT d.match_id) as matches,
                SUM(d.runs_batter) as total_runs,
                ROUND(SUM(d.runs_batter) * 1.0 / NULLIF(COUNT(DISTINCT d.match_id), 0), 2) as avg_per_match
            FROM deliveries d
            JOIN matches m ON d.match_id = m.id
            WHERE m.season = ?
            GROUP BY d.batter
            HAVING matches >= 5
            ORDER BY avg_per_match DESC
            LIMIT 10
        """, (season,))
        return jsonify({
            "season": season,
            "top_batsmen": [dict(r) for r in results]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@insights_bp.route("/death-bowlers", methods=["GET"])
def death_over_specialists():
    try:
        results = query("""
            SELECT
                bowler,
                COUNT(*) as balls_bowled,
                SUM(runs_total) as runs_conceded,
                COUNT(CASE WHEN wicket_kind IS NOT NULL AND wicket_kind != 'run_out' THEN 1 END) as wickets,
                ROUND(SUM(runs_total) * 6.0 / NULLIF(COUNT(*), 0), 2) as economy
            FROM deliveries
            WHERE over_number >= 17
            GROUP BY bowler
            HAVING balls_bowled >= 30
            ORDER BY economy ASC
            LIMIT 10
        """)
        return jsonify([dict(r) for r in results])
    except Exception as e:
        return jsonify({"error": str(e)}), 500