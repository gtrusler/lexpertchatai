# Lexpert Case AI - Technical Stack

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
- **Architecture**: Modular structure with dedicated modules for:
  - API routes (`/app/api/routes/`)
  - Services (`/app/services/`)
  - Models (`/app/models/`)
  - Core utilities (`/app/core/`)
- **Environment Management**: Conda
- **API Documentation**: Swagger UI (auto-generated)
- **Port**: Default http://localhost:8000

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
