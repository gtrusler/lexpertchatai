"""
Main entry point for the Lexpert Case AI API.
This file serves as a simple wrapper around the modular application structure.
"""
import uvicorn
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import the FastAPI app from the modular structure
from app.main import app

if __name__ == "__main__":
    logger.info("Starting Lexpert Case AI API server")
    uvicorn.run(app, host="0.0.0.0", port=8000)
