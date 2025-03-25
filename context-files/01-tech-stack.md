# Lexpert Case AI - Technical Stack

## AI Integration

- **Primary AI Provider**: OpenAI
- **Models Used**:
  - GPT-4o for chat responses
  - text-embedding-3-small for document embeddings
- **API Integration**: Direct integration via OpenAI Python client
- **Bot Context**: System prompts customized based on bot type/ID
- **No Mock Data**: Using actual API calls for all AI operations, no hardcoded mock responses

## Frontend Stack

- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Routing**: React Router v6
- **State Management**: React Context API
- **Build Tool**: Vite
- **Package Manager**: npm
- **File Upload**: Native File API with Supabase Storage
- **UI Components**: Custom components with dark mode support
- **Primary Color**: Deep blue (#0078D4) for headers and buttons

## Backend Stack

- **Framework**: FastAPI
- **Language**: Python 3.10+
- **AI Integration**:
  - OpenAI Python client
  - Direct API calls with proper error handling
  - System context based on bot selection
- **Architecture**: Modular structure with dedicated modules for:
  - API routes (`/app/api/routes/`)
  - Services (`/app/services/`)
    - `ai_service.py` - Real OpenAI integration
    - `storage_service.py` - Supabase storage operations
  - Models (`/app/models/`)
  - Core utilities (`/app/core/`)
  - Error handling (`/app/core/errors/`)
  - Middleware (`/app/middleware/`)
  - Configuration (`/app/config/`)
- **Environment Management**: Conda
- **API Documentation**: Swagger UI (auto-generated)
- **Port**: Default http://localhost:8000
- **Error Handling**: Centralized error handling with custom exceptions
- **Logging**: Structured logging with different levels for development/production
- **Testing**: Pytest with async support for API testing

## Database & Storage

- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Vector Store**: pgvector for embeddings
- **Access Control**: Row Level Security (RLS)
- **Primary bucket**: `documents` - Used for all document storage
- **File path format**: `{botId || 'general'}/{timestamp}_{filename}`

## Supabase Schema

### Templates Table

- `id`: UUID (primary key, default gen_random_uuid())
- `name`: TEXT (not null, unique)
- `description`: TEXT
- `content`: TEXT
- `prompt`: TEXT
- `case_history`: TEXT
- `participants`: TEXT
- `objective`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE (default now())
- `updated_at`: TIMESTAMP WITH TIME ZONE (default now(), updated via trigger)

### Template-Document Connections

- `template_documents` junction table with:
  - `template_id`: UUID (references templates.id with CASCADE delete)
  - `document_id`: UUID
  - `created_at`: TIMESTAMP WITH TIME ZONE (default now())
  - Primary key on (template_id, document_id)

## Environment Configuration

### Environment Files

1. `/backend/.env` - Main backend environment file

   - Contains: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, REDIS_URL
   - Used by: The FastAPI backend server
   - **Critical**: OPENAI_API_KEY must be properly set for AI functionality

2. `/.env` - Root environment file

   - Contains: VITE_SUPABASE_URL, VITE_SUPABASE_KEY (anon key), ANTHROPIC_API_KEY, OPENAI_API_KEY, REDIS_URL
   - Used by: Root level scripts and potentially as fallback

3. `/src/frontend/.env` - Frontend environment file
   - Contains: VITE_SUPABASE_URL, VITE_SUPABASE_KEY (anon key)
   - Used by: The React frontend application

### Key Usage Notes

- Frontend files should use the anon key (VITE_SUPABASE_KEY)
- Backend files should use the service_role key (SUPABASE_SERVICE_KEY)
- Environment variables are accessed in frontend code using import.meta.env
- Environment variables are accessed in backend code using os.getenv()
- OpenAI API key must be properly configured for AI functionality

## Storage Implementation

### Best Practices

1. **Client-Side Storage Operations**:

   - Use the storage service from `src/frontend/src/services/supabase.ts`
   - Always check bucket existence before upload
   - Handle bucket creation errors gracefully
   - Use upsert option to prevent duplicates

2. **Error Handling**:

   - Check for "already exists" in error messages for buckets
   - Provide user-friendly error messages
   - Log detailed errors to console for debugging
   - Implement proper StorageError type handling

3. **File Naming and Organization**:
   - Use timestamps in filenames to ensure uniqueness
   - Group files by botId or use 'general' as default
   - Replace spaces with underscores in filenames
   - Use consistent path format across the application

## Component Structure

- Follow established component hierarchy pattern:
  - Container components handle logic and state
  - Presentational components focus on UI
  - Error/loading states handled consistently across features

## File Naming Conventions

- React components: PascalCase.tsx
- Utility functions: camelCase.ts
- Context providers: XxxContext.tsx
- Page components: PascalCase.tsx in pages directory

## Testing Framework

### Frontend Testing

- **Framework**: Jest with ts-jest
- **Testing Library**: Testing Library for React
- **Configuration**:
  - ESM module support with `esModuleInterop`
  - Environment setup in `src/test/setup.ts`
  - File type mocks for CSS, images, and other assets
  - Properly configured transformIgnorePatterns for node_modules
- **Mock Setup**:
  - TextEncoder/TextDecoder mocks for jsdom
  - FileReader mock for file upload testing
  - Environment variable mocking in test environment
  - Fetch API mocking
  - **Note**: Mock data should only be used in tests, not in production code
- **Best Practices**:
  - Use singleton pattern for service mocks
  - Hard-code test responses instead of trying to read File objects
  - Mock DocumentProcessingService behavior consistently
  - Include performance testing for critical operations
  - Test both unit functionality and integration flows

### Backend Testing

- **Framework**: Pytest with async support
- **Mock Support**: pytest-mock for external dependencies
- **Coverage**: pytest-cov for code coverage reporting
- **API Testing**: TestClient from FastAPI for endpoint testing

## Project Structure and Running the Application

### Project Structure

- The main frontend code is located in `src/frontend/`, not in the root `src/` directory
- The backend is located in the root `backend/` directory
- The project uses Conda for environment management

### Running the Application

1. Start the frontend:

   ```bash
   # Activate conda environment first
   conda activate lexpert_case_ai

   # Navigate to the frontend directory and start the server
   cd src/frontend
   npm run dev
   ```

2. Start the backend (in a separate terminal):

   ```bash
   # Activate conda environment first (in a new terminal window)
   conda activate lexpert_case_ai

   # Navigate to the backend directory and start the server
   cd backend
   uvicorn main:app --reload
   ```

### Important Notes

- **Always activate the conda environment** (`conda activate lexpert_case_ai`) in each new terminal window before running any commands
- Frontend server runs on port 5173 by default (http://localhost:5173)
- Backend server runs on port 8000 by default (http://localhost:8000)
- API documentation is available at http://localhost:8000/docs when the backend is running
