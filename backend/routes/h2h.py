from flask import Blueprint, request, jsonify
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query

h2h_bp = Blueprint("h2h", __name__)


@h2h_bp.route("", methods=["POST"])
def head_to_head():
    data = request.get_json()
    batsman = data.get("batsman", "")
    bowler = data.get("bowler", "")

    if not batsman or not bowler:
        return jsonify({"error": "batsman and bowler required"}), 400

    # Overall H2H
    overall = query("""
        SELECT
            COUNT(*) as balls_faced,
            SUM(runs_batter) as runs_scored,
            ROUND(SUM(runs_batter) * 100.0 / NULLIF(COUNT(*), 0), 2) as strike_rate,
            COUNT(CASE WHEN wicket_kind IS NOT NULL AND wicket_kind != 'run_out' THEN 1 END) as dismissals,
            SUM(CASE WHEN runs_batter = 4 THEN 1 ELSE 0 END) as fours,
            SUM(CASE WHEN runs_batter = 6 THEN 1 ELSE 0 END) as sixes,
            SUM(CASE WHEN runs_batter = 0 THEN 1 ELSE 0 END) as dot_balls
        FROM deliveries
        WHERE batter=? AND bowler=?
    """, (batsman, bowler), one=True)

    # Dismissal types breakdown
    dismissals = query("""
        SELECT wicket_kind, COUNT(*) as count
        FROM deliveries
        WHERE batter=? AND bowler=? AND wicket_kind IS NOT NULL AND wicket_kind != 'run_out'
        GROUP BY wicket_kind
        ORDER BY count DESC
    """, (batsman, bowler))

    # Per-over performance (powerplay, middle, death)
    phase_stats = query("""
        SELECT
            CASE
                WHEN over_number <= 6 THEN 'Powerplay (1-6)'
                WHEN over_number <= 15 THEN 'Middle (7-15)'
                ELSE 'Death (16-20)'
            END as phase,
            COUNT(*) as balls,
            SUM(runs_batter) as runs,
            ROUND(SUM(runs_batter) * 100.0 / NULLIF(COUNT(*), 0), 2) as sr,
            COUNT(CASE WHEN wicket_kind IS NOT NULL AND wicket_kind != 'run_out' THEN 1 END) as wickets
        FROM deliveries
        WHERE batter=? AND bowler=?
        GROUP BY phase
    """, (batsman, bowler))

    # Shot zone breakdown
    zones = query("""
        SELECT shot_zone, SUM(runs_batter) as runs, COUNT(*) as balls
        FROM deliveries
        WHERE batter=? AND bowler=? AND shot_zone IS NOT NULL
        GROUP BY shot_zone
        ORDER BY runs DESC
    """, (batsman, bowler))

    # Match-by-match history
    history = query("""
        SELECT m.match_date, m.team1, m.team2,
               SUM(d.runs_batter) as runs,
               COUNT(*) as balls,
               COUNT(CASE WHEN d.wicket_kind IS NOT NULL AND d.wicket_kind != 'run_out' THEN 1 END) as dismissed
        FROM deliveries d
        JOIN matches m ON d.match_id = m.id
        WHERE d.batter=? AND d.bowler=?
        GROUP BY d.match_id
        ORDER BY m.match_date DESC
        LIMIT 10
    """, (batsman, bowler))

    return jsonify({
        "batsman": batsman,
        "bowler": bowler,
        "overall": dict(overall) if overall else {},
        "dismissals": [dict(d) for d in dismissals],
        "phase_stats": [dict(p) for p in phase_stats],
        "shot_zones": [dict(z) for z in zones],
        "match_history": [dict(h) for h in history],
    })
