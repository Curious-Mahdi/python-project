from flask import Blueprint, jsonify
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query

match_bp = Blueprint("match", __name__)


@match_bp.route("/list", methods=["GET"])
def list_matches():
    """List matches with optional season filter and pagination."""
    from flask import request
    season = request.args.get("season", type=int)
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)

    if season:
        matches = query(
            "SELECT id, match_date, venue, team1, team2, winner, result_margin, season, match_number FROM matches WHERE season=? ORDER BY match_date DESC LIMIT ? OFFSET ?",
            (season, limit, offset)
        )
    else:
        matches = query(
            "SELECT id, match_date, venue, team1, team2, winner, result_margin, season, match_number FROM matches ORDER BY match_date DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
    return jsonify([dict(m) for m in matches])


@match_bp.route("/<int:match_id>/worm", methods=["GET"])
def worm_chart(match_id):
    """Returns cumulative ball-by-ball runs for both innings."""
    innings_list = query(
        "SELECT id, innings_number, batting_team FROM innings WHERE match_id=? ORDER BY innings_number",
        (match_id,)
    )

    result = []
    for inn in innings_list:
        deliveries = query(
            """SELECT over_number, ball_number, runs_total, wicket_kind, player_dismissed
               FROM deliveries WHERE innings_id=?
               ORDER BY over_number, ball_number""",
            (inn["id"],)
        )

        cumulative = 0
        balls = []
        for d in deliveries:
            cumulative += d["runs_total"]
            balls.append({
                "over": d["over_number"],
                "ball": d["ball_number"],
                "label": f"{d['over_number']}.{d['ball_number']}",
                "cumulative_runs": cumulative,
                "wicket": d["wicket_kind"] is not None,
                "player_dismissed": d["player_dismissed"],
                "runs_this_ball": d["runs_total"],
            })

        result.append({
            "innings": inn["innings_number"],
            "batting_team": inn["batting_team"],
            "data": balls,
        })

    return jsonify(result)


@match_bp.route("/<int:match_id>/manhattan", methods=["GET"])
def manhattan_chart(match_id):
    """Returns per-over run totals + wickets for both innings."""
    innings_list = query(
        "SELECT id, innings_number, batting_team FROM innings WHERE match_id=? ORDER BY innings_number",
        (match_id,)
    )

    result = []
    for inn in innings_list:
        overs = query(
            """SELECT over_number,
                      SUM(runs_total) as over_runs,
                      COUNT(CASE WHEN wicket_kind IS NOT NULL THEN 1 END) as wickets
               FROM deliveries WHERE innings_id=?
               GROUP BY over_number
               ORDER BY over_number""",
            (inn["id"],)
        )

        result.append({
            "innings": inn["innings_number"],
            "batting_team": inn["batting_team"],
            "data": [dict(o) for o in overs],
        })

    return jsonify(result)


@match_bp.route("/<int:match_id>/scorecard", methods=["GET"])
def scorecard(match_id):
    """Full batting/bowling scorecard."""
    match = query("SELECT * FROM matches WHERE id=?", (match_id,), one=True)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    innings_list = query(
        "SELECT id, innings_number, batting_team, bowling_team, total_runs, total_wickets FROM innings WHERE match_id=?",
        (match_id,)
    )

    scorecard = []
    for inn in innings_list:
        batting = query("""
            SELECT batter,
                   SUM(runs_batter) as runs,
                   COUNT(*) as balls,
                   ROUND(SUM(runs_batter)*100.0/NULLIF(COUNT(*),0),1) as sr,
                   SUM(CASE WHEN runs_batter=4 THEN 1 ELSE 0 END) as fours,
                   SUM(CASE WHEN runs_batter=6 THEN 1 ELSE 0 END) as sixes,
                   MAX(wicket_kind) as dismissal
            FROM deliveries WHERE innings_id=?
            GROUP BY batter ORDER BY runs DESC
        """, (inn["id"],))

        bowling = query("""
            SELECT bowler,
                   COUNT(*) as balls,
                   ROUND(COUNT(*)/6.0,1) as overs,
                   SUM(runs_total) as runs,
                   COUNT(CASE WHEN wicket_kind IS NOT NULL AND wicket_kind!='run_out' THEN 1 END) as wickets,
                   ROUND(SUM(runs_total)*6.0/NULLIF(COUNT(*),0),2) as economy
            FROM deliveries WHERE innings_id=?
            GROUP BY bowler ORDER BY wickets DESC
        """, (inn["id"],))

        scorecard.append({
            "innings": inn["innings_number"],
            "batting_team": inn["batting_team"],
            "bowling_team": inn["bowling_team"],
            "total_runs": inn["total_runs"],
            "total_wickets": inn["total_wickets"],
            "batting": [dict(b) for b in batting],
            "bowling": [dict(b) for b in bowling],
        })

    return jsonify({"match": dict(match), "scorecard": scorecard})
