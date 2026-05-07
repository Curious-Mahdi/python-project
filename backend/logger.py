
import logging
import os

log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "sportsmassive.log")),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("SportsMassive")

def log_request(response):
    from flask import request
    logger.info(f"{request.method} {request.path} - {response.status_code}")
    return response