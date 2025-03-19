"""
Supabase client module for handling database connections.
Provides a centralized client for all Supabase operations.
"""
import os
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Global client instance
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or initialize the Supabase client with proper error handling.
    
    Returns:
        Client: Initialized Supabase client
        
    Raises:
        ValueError: If Supabase credentials are missing
        Exception: If client initialization fails
    """
    global _supabase_client
    
    # Return existing client if already initialized
    if _supabase_client is not None:
        return _supabase_client
    
    try:
        # Log credentials status (masked for security)
        url_debug = SUPABASE_URL[:10] + "..." if SUPABASE_URL else "None"
        key_debug = "Present" if SUPABASE_KEY else "None"
        logger.debug(f"Supabase credentials: URL={url_debug}, Key={key_debug}")
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.error("Missing Supabase credentials")
            raise ValueError("Missing Supabase credentials")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise
