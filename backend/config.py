import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "database", "ipl.db")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "sportsmassive-super-secret-2024")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
