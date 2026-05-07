from flask import Blueprint, request, jsonify
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query
from config import GEMINI_API_KEY

predict_bp = Blueprint("predict", __name__)

# ---------- Gemini helper ----------
def get_gemini_client():
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        return genai.GenerativeModel("gemini-1.5-pro")
    except Exception:
        return None


def ai_generate(prompt: str, fallback: str) -> str:
    model = get_gemini_client()
    if not model:
        return fallback
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return fallback


# ---------- Routes ----------
@predict_bp.route("/season", methods=["POST"])
def predict_season():
    """Predict top 3 run scorers for the current season."""
    data = request.get_json() or {}
    season = data.get("season", 2023)

    # Aggregate batting stats per player this season
    top_batters = query("""
        SELECT d.batter,
               p.team,
               p.role,
               SUM(d.runs_batter) as total_runs,
               COUNT(*) as balls_faced,
               ROUND(SUM(d.runs_batter)*100.0/NULLIF(COUNT(*),0),2) as strike_rate,
               COUNT(DISTINCT d.match_id) as matches,
               SUM(CASE WHEN d.runs_batter=4 THEN 1 ELSE 0 END) as fours,
               SUM(CASE WHEN d.runs_batter=6 THEN 1 ELSE 0 END) as sixes
        FROM deliveries d
        JOIN matches m ON d.match_id = m.id
        LEFT JOIN players p ON d.batter = p.name
        WHERE m.season=?
        GROUP BY d.batter
        HAVING balls_faced > 10
        ORDER BY total_runs DESC
        LIMIT 10
    """, (season,))

    predictions = [dict(b) for b in top_batters]

    # Build AI narrative
    if predictions:
        names = ", ".join(p["batter"] for p in predictions)
        stats_summary = "\n".join(
            f"- {p['batter']} ({p.get('team','Unknown')}): {p['total_runs']} runs, SR {p['strike_rate']}, {p['matches']} matches"
            for p in predictions
        )
        fallback = (
            f"Based on current season form, the predicted top 3 run scorers are: {names}. "
            f"These players have shown exceptional consistency and strike rates this season."
        )
        ai_prompt = f"""You are an expert IPL cricket analyst. Based on these current season batting statistics, 
write a compelling 3-paragraph analysis (150-200 words) explaining why these are the top run scorers 
and what tactical advantages they bring to their teams. Focus on player strengths, pitch conditions, and fantasy cricket value.

Season {season} Top Batters:
{stats_summary}

Write in an engaging, professional sports analytics style."""

        narrative = ai_generate(ai_prompt, fallback)
    else:
        predictions = []
        narrative = "Insufficient data for predictions. Please ensure match data is loaded."

    # Confidence scores (normalized from strike rate + runs)
    max_runs = max((p.get("total_runs", 0) for p in predictions), default=1)
    for p in predictions:
        p["confidence"] = round(min(95, (p.get("total_runs", 0) / max(max_runs, 1)) * 80 + 15), 1)

    return jsonify({
        "season": season,
        "predictions": predictions,
        "ai_narrative": narrative,
    })


@predict_bp.route("/battle-story", methods=["POST"])
def battle_story():
    """Generate AI narrative for H2H matchup."""
    data = request.get_json() or {}
    batsman = data.get("batsman", "")
    bowler = data.get("bowler", "")
    stats = data.get("stats", {})

    if not batsman or not bowler:
        return jsonify({"error": "batsman and bowler required"}), 400

    fallback = (
        f"The battle between {batsman} and {bowler} is one of cricket's most fascinating matchups. "
        f"Historical data reveals a compelling contest of skill, strategy, and nerves."
    )

    if not stats:
        return jsonify({"story": fallback})

    balls = stats.get("balls_faced", 0)
    runs = stats.get("runs_scored", 0)
    dismissals = stats.get("dismissals", 0)
    sr = stats.get("strike_rate", 0)

    ai_prompt = f"""You are an expert IPL cricket analyst. Write a 2-paragraph narrative (120-150 words) 
about the head-to-head battle between {batsman} (batter) and {bowler} (bowler).

Historical Stats:
- {batsman} has scored {runs} runs off {balls} balls (SR: {sr}) 
- {bowler} has dismissed {batsman} {dismissals} times

Analyze WHY this is a compelling matchup. Discuss:
1. The bowler's typical deliveries vs the batter's weaknesses
2. Fantasy cricket recommendation (who has the edge right now?)

Write in an engaging, punchy sports commentary style. End with a bold prediction."""

    story = ai_generate(ai_prompt, fallback)
    return jsonify({"story": story})


@predict_bp.route("/dashboard-insight", methods=["GET"])
def dashboard_insight():
    """Daily scout insight based on recent form."""
    # Get most in-form batter (last 3 matches)
    in_form = query("""
        SELECT d.batter, SUM(d.runs_batter) as recent_runs, p.team
        FROM deliveries d
        JOIN matches m ON d.match_id = m.id
        LEFT JOIN players p ON d.batter = p.name
        WHERE m.id IN (SELECT id FROM matches ORDER BY match_date DESC LIMIT 3)
        GROUP BY d.batter
        HAVING COUNT(*) > 3
        ORDER BY recent_runs DESC
        LIMIT 1
    """, one=True)

    if not in_form:
        return jsonify({
            "insight": "Load match data to get your daily scout insight.",
            "player": None
        })

    player_name = in_form["batter"]
    runs = in_form["recent_runs"]
    team = in_form.get("team", "Unknown")

    fallback = (
        f"🔥 SCOUT ALERT: {player_name} ({team}) is the hottest batter right now with "
        f"{runs} runs in the last 3 matches. Strong fantasy pick this week!"
    )

    ai_prompt = f"""In exactly 2 sentences, give a sharp cricket scout insight about {player_name} from {team} 
who has scored {runs} runs in their last 3 IPL matches. 
Include a fantasy cricket recommendation. Be direct and punchy."""

    insight = ai_generate(ai_prompt, fallback)
    return jsonify({"insight": insight, "player": player_name, "team": team, "recent_runs": runs})
