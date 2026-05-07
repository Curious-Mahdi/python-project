import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import JWT_SECRET_KEY
from logger import logger, log_request
from database.db import init_db
from database.seed import seed

from routes.auth import auth_bp
from routes.players import players_bp
from routes.h2h import h2h_bp
from routes.watchlist import watchlist_bp
from routes.match import match_bp
from routes.predict import predict_bp
from routes.export import export_bp
from routes.meta import meta_bp
from routes.insights import insights_bp

def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # Tokens don't expire for demo

    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])
    JWTManager(app)
app.after_request(log_request)
    
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(players_bp, url_prefix="/api/players")
    app.register_blueprint(h2h_bp, url_prefix="/api/head-to-head")
    app.register_blueprint(watchlist_bp, url_prefix="/api/watchlist")
    app.register_blueprint(match_bp, url_prefix="/api/match")
    app.register_blueprint(predict_bp, url_prefix="/api/predict")
    app.register_blueprint(export_bp, url_prefix="/api/export")
    app.register_blueprint(meta_bp, url_prefix="/api/meta")
    app.register_blueprint(insights_bp, url_prefix="/api/insights")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "SportsMassive IPL Intelligence Hub"}

    return app


if __name__ == "__main__":
    init_db()


    from database.db import query as db_query
    match_count = db_query("SELECT COUNT(*) as cnt FROM matches", one=True)
    if not match_count or match_count["cnt"] == 0:
        print("[SportsMassive] No data found — loading demo seed...")
        seed()
    else:
        seasons = db_query("SELECT MIN(season) as mn, MAX(season) as mx, COUNT(*) as cnt FROM matches", one=True)
        print(f"[SportsMassive] Database loaded: {seasons['cnt']} matches ({seasons['mn']}–{seasons['mx']})")

    app = create_app()
    print("[SportsMassive] Backend running at http://localhost:5000")
    print("[SportsMassive] API: /api/auth, /api/players, /api/head-to-head, /api/match, /api/predict\n")
    app.run(debug=True, port=5000)

