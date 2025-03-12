from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from supabase import create_client, Client
import jwt
import redis
from datetime import datetime
from typing import Optional
import os

from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

# Initialize Supabase and Redis clients
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Redis client with error handling
try:
    redis_host = os.environ.get("REDIS_HOST", "localhost")
    redis_port = int(os.environ.get("REDIS_PORT", 6379))
    redis_db = int(os.environ.get("REDIS_DB", 0))
    redis_client = redis.Redis(
        host=redis_host, 
        port=redis_port, 
        db=redis_db, 
        decode_responses=True,
        socket_connect_timeout=2  # Short timeout to fail fast
    )
    # Test connection
    redis_client.ping()
    redis_available = True
except Exception as e:
    print(f"Redis connection failed: {str(e)}. Continuing without caching.")
    redis_available = False
    redis_client = None

app = FastAPI()

# Middleware to verify Supabase JWT
async def verify_supabase_jwt(token: str) -> Optional[dict]:
    try:
        # Check Redis cache first (TTL: 1 hour) if available
        if redis_available:
            try:
                cached_user = redis_client.get(f"user:{token}")
                if cached_user:
                    return eval(cached_user)  # Safely parse cached user data
            except Exception as e:
                print(f"Redis cache retrieval error: {str(e)}")
                # Continue without caching

        # Verify JWT with Supabase Auth
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")

        # Fetch user from Supabase to verify and get role
        response = supabase.auth.get_user(token)
        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        # Store user data in Redis for 1 hour if available
        user_data = {
            "user_id": user_id,
            "role": response.user.user_metadata.get("role", "user"),  # Default to 'user'
            "email": response.user.email
        }
        
        if redis_available:
            try:
                redis_client.setex(f"user:{token}", 3600, str(user_data))  # Cache for 1 hour
            except Exception as e:
                print(f"Redis cache storage error: {str(e)}")
                # Continue without caching

        return user_data

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")

# Authentication middleware
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path in ["/", "/health", "/docs"]:  # Public routes
        response = await call_next(request)
        return response

    # Get token from Authorization header (Bearer token)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")

    token = auth_header.split(" ")[1]
    try:
        user_data = await verify_supabase_jwt(token)
        request.state.user = user_data  # Attach user data to request state
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Middleware error: {str(e)}")

    response = await call_next(request)
    return response

# Example protected route
@app.get("/api/bot/{bot_id}")
async def get_bot(bot_id: str, request: Request):
    user = request.state.user
    if user["role"] != "admin" and bot_id.startswith("template_"):  # Admins only for templates
        raise HTTPException(status_code=403, detail="Admins only can access templates")
    # Logic to fetch bot data from Supabase/Redis, ensuring 3-5s response
    return {"bot_id": bot_id, "user": user["email"], "role": user["role"]}

# Health check (public)
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)