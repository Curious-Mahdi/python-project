from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query, execute

watchlist_bp = Blueprint("watchlist", __name__)


@watchlist_bp.route("", methods=["GET"])
@jwt_required()
def get_watchlist():
    user_id = get_jwt_identity()
    items = query(
        "SELECT player_name, added_at FROM watchlist WHERE user_id=? ORDER BY added_at DESC",
        (user_id,)
    )
    return jsonify([dict(i) for i in items])


@watchlist_bp.route("", methods=["POST"])
@jwt_required()
def add_to_watchlist():
    user_id = get_jwt_identity()
    data = request.get_json()
    player_name = data.get("player_name", "")
    if not player_name:
        return jsonify({"error": "player_name required"}), 400
    try:
        execute(
            "INSERT INTO watchlist (user_id, player_name) VALUES (?,?)",
            (user_id, player_name)
        )
        return jsonify({"message": f"{player_name} added to watchlist"}), 201
    except Exception:
        return jsonify({"error": "Already in watchlist"}), 409


@watchlist_bp.route("/<player_name>", methods=["DELETE"])
@jwt_required()
def remove_from_watchlist(player_name):
    user_id = get_jwt_identity()
    execute(
        "DELETE FROM watchlist WHERE user_id=? AND player_name=?",
        (user_id, player_name)
    )
    return jsonify({"message": f"{player_name} removed from watchlist"}), 200
