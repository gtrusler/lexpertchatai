"""
Main application entry point for the Lexpert Case AI API.
"""
import logging
import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import chat, storage
from .core.app import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Include routers
app.include_router(chat.router)
app.include_router(storage.router)

# Add startup event handler
@app.on_event("startup")
async def startup_event():
    """Perform startup tasks"""
    logger.info("Starting Lexpert Case AI API")
    
    # Log environment status
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.warning("Missing Supabase credentials - API may not function correctly")
    else:
        logger.info("Supabase credentials found")
    
    logger.info("Lexpert Case AI API started successfully")


# Add shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    """Perform shutdown tasks"""
    logger.info("Shutting down Lexpert Case AI API")


# Entry point for running the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
