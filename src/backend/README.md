# Lexpert Case AI Backend

This is the backend for the Lexpert Case AI application, a Retrieval-Augmented Generation (RAG) chatbot for family law and trademark attorneys.

## Authentication Setup

The backend uses Supabase for authentication. Here's how to set it up:

### Prerequisites

- Python 3.9+
- Redis (optional, for token caching)
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your Supabase credentials

### Running the Server

```bash
python app.py
```

The server will start at http://localhost:8000

## Testing Authentication

To test the authentication functionality:

1. Make sure you have a Supabase account set up with email/password authentication enabled
2. Create a test user in Supabase with the credentials specified in your `.env` file
3. Run the authentication test script:
   ```bash
   python test_auth.py
   ```

The test script will:

1. Test access to a public endpoint (`/health`)
2. Test login with Supabase
3. Test access to a protected endpoint with a valid token
4. Test access to a protected endpoint without a token

## API Endpoints

### Public Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check

### Protected Endpoints (Require Authentication)

- `POST /api/rag` - Process a RAG query
- `POST /api/upload` - Upload a document
- `POST /api/auto-tag` - Auto-tag content
- `POST /api/prompt-coach` - Get prompt coaching

## Authentication Flow

1. Frontend authenticates with Supabase
2. Frontend includes the Supabase JWT token in the Authorization header
3. Backend verifies the token with Supabase
4. If valid, the request is processed; otherwise, a 401 error is returned

## Redis Caching (Optional)

The authentication middleware can use Redis to cache user data, reducing the number of verification requests to Supabase. To enable this:

1. Install Redis on your system
2. Update the Redis configuration in the `.env` file
3. Ensure the Redis server is running
