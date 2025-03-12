import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Project paths
ROOT_DIR = Path(__file__).parent.parent.parent
DATA_DIR = ROOT_DIR / "src" / "data"
SAMPLE_DOCS_DIR = DATA_DIR / "sample_docs"

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Anthropic configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Redis configuration (optional)
REDIS_URL = os.getenv("REDIS_URL")
REDIS_ENABLED = bool(REDIS_URL)

# Vector database configuration
VECTOR_DIMENSION = 1536  # OpenAI embeddings dimension
CHUNK_SIZE = 500  # Token size for text chunks
CHUNK_OVERLAP = 50  # Token overlap between chunks

# Auto-tagging configuration
CONFIDENCE_THRESHOLD = 0.85  # Minimum confidence for auto-tagging
SUPPORTED_TAGS = ["petition", "office_action", "example"]

# UI configuration
UI_THEME = {
    "primary_color": "#0078D4",  # Deep blue
    "background_color": "#F5F6F7",  # Light gray
    "card_color": "#FFFFFF",  # White
    "font_family": "Inter, Roboto, sans-serif"
}

# Performance settings
TARGET_RESPONSE_TIME = 5  # seconds
CACHE_TTL = 3600  # 1 hour cache TTL
MAX_CONCURRENT_REQUESTS = 50 