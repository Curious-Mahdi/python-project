from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import query, execute

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    existing = query("SELECT id FROM users WHERE email=? OR username=?", (email, username), one=True)
    if existing:
        return jsonify({"error": "Username or email already exists"}), 409

    pw_hash = generate_password_hash(password)
    user_id = execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
        (username, email, pw_hash)
    )
    token = create_access_token(identity=str(user_id))
    return jsonify({"token": token, "username": username, "user_id": user_id}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    user = query("SELECT * FROM users WHERE email=?", (email,), one=True)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["id"]))
    return jsonify({"token": token, "username": user["username"], "user_id": user["id"]}), 200
