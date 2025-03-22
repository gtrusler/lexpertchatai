# Lexpert Case AI - Technical Context

## Technologies Used

### Frontend Stack

- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **Build Tool**: Vite
- **Package Manager**: npm
- **File Upload**: Native File API with Supabase Storage
- **UI Components**: Custom components with dark mode support

### Backend Stack

- **Framework**: FastAPI
- **Language**: Python 3.10+
- **Architecture**: Modular structure with dedicated modules for:
  - API routes (`/app/api/routes/`)
  - Services (`/app/services/`)
  - Models (`/app/models/`)
  - Core utilities (`/app/core/`)
- **Environment Management**: Conda
- **API Documentation**: Swagger UI (auto-generated)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Vector Store**: pgvector for embeddings
- **Access Control**: Row Level Security (RLS)
- **Logging**: Structured logging with Python's logging module

### AI and NLP

- **Large Language Models**:
  - OpenAI GPT-4o
  - Anthropic Claude 3.5 Sonnet
  - Optional: xAI Grok
- **Embeddings**: OpenAI Embeddings
- **NLP Processing**: spaCy, Hugging Face Transformers
- **RAG Framework**: LangChain, LlamaIndex

### Data Storage

- **Primary Database**: Supabase (PostgreSQL)
- **Vector Storage**: pgvector extension
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Caching**: Redis (optional)

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Conda
- Git
- Supabase account
- OpenAI API key
- Anthropic API key (optional)

### Local Environment Setup

1. **Clone Repository**:

   ```bash
   git clone https://github.com/username/lexpertcaseai.git
   cd lexpertcaseai
   ```

2. **Frontend Setup**:

   ```bash
   cd src/frontend
   npm install
   npm run dev
   ```

   Frontend will be available at: http://localhost:5173

3. **Backend Setup**:

   ```bash
   conda create -n lexpert_case_ai python=3.10
   conda activate lexpert_case_ai
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

   Backend API will be available at: http://localhost:8000
   Swagger UI: http://localhost:8000/docs

4. **Environment Variables**:
   Create a `.env` file in both frontend and backend directories with the following variables:

   ```
   # Frontend .env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8000

   # Backend .env
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

## Technical Constraints

### Performance Requirements

- **Response Time**: 3-5 seconds for typical queries
- **Throughput**: Support for 50+ concurrent users
- **Scalability**: Handle 100+ cases, 1GB+ documents

### Security Constraints

- **Data Privacy**: All case data must be private by default
- **Authentication**: Secure user authentication via Supabase Auth
- **Authorization**: Role-based access control for multi-user scenarios
- **Encryption**: Encrypted data storage and transmission

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Browsers**: iOS Safari, Android Chrome
- **Minimum Resolution**: 320px width (mobile) to 1920px (desktop)

### Accessibility Requirements

- **WCAG Compliance**: Level AA compliance
- **Screen Reader Support**: ARIA attributes for all interactive elements
- **Keyboard Navigation**: Full functionality without mouse
- **Color Contrast**: Minimum 4.5:1 ratio for text

## Dependencies

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "tailwindcss": "^3.2.4",
    "@supabase/supabase-js": "^2.8.0",
    "@heroicons/react": "^2.0.18"
  },
  "devDependencies": {
    "typescript": "^4.9.5",
    "vite": "^4.1.0",
    "@types/react": "^18.0.27",
    "@types/react-dom": "^18.0.10"
  }
}
```

### Backend Dependencies

```
fastapi==0.95.0
uvicorn==0.21.1
pydantic==1.10.7
python-dotenv==1.0.0
supabase==1.0.3
langchain==0.0.267
llama-index==0.8.11
openai==0.27.8
anthropic==0.5.0
spacy==3.6.0
redis==4.6.0
```

## API Endpoints

### Authentication

- `POST /auth/register`: Register new user
- `POST /auth/login`: Login user
- `POST /auth/logout`: Logout user
- `GET /auth/user`: Get current user

### Assistants (formerly Bots)

- `GET /assistants`: List all assistants for current user
- `GET /assistants/{id}`: Get specific assistant
- `POST /assistants`: Create new assistant
- `PUT /assistants/{id}`: Update assistant
- `DELETE /assistants/{id}`: Delete assistant

### Chat

- `POST /chat`: Send message to assistant
- `GET /chat/{assistant_id}/history`: Get chat history
- `DELETE /chat/{assistant_id}/history`: Clear chat history

### Documents

- `POST /documents`: Upload document
- `GET /documents`: List documents
- `GET /documents/{id}`: Get document
- `DELETE /documents/{id}`: Delete document

### Wizard

- `GET /templates`: List available templates
- `POST /assistants/create`: Create assistant from wizard data

## Development Workflow

1. **Feature Branches**: Create feature branches from `main`
2. **Pull Requests**: Submit PRs for code review
3. **CI/CD**: Automated testing via GitHub Actions
4. **Deployment**: Automated deployment to staging/production

## Frontend Component Structure

### Common Components

- **Card**: Reusable card component with proper event handling
- **Button**: Styled button with variants (primary, secondary, etc.)
- **Tooltip**: Contextual help tooltips
- **LoadingSpinner**: Loading indicator with size variants
- **FileUpload**: File upload component with drag-and-drop support

### Page Components

- **Dashboard**: Main landing page showing assistants and cases
- **Chat**: Conversation interface for interacting with assistants
- **Wizard**: Multi-step assistant creation process
- **Login**: Authentication page

### Context Providers

- **ThemeContext**: Manages dark/light mode preferences
- **AuthContext**: Handles user authentication state

## Monitoring and Logging

- **Application Logs**: Structured JSON logs
- **Error Tracking**: Sentry integration
- **Performance Monitoring**: Custom metrics for response times
- **Usage Analytics**: Anonymous usage data for feature optimization

## Frontend Architecture

### Theme System

- **Implementation**: React Context API with TypeScript
- **State Management**: Local state with localStorage persistence
- **Styling**: Tailwind CSS with dark mode support
- **Transitions**: CSS transitions for smooth theme changes
- **System Integration**: System preference detection for initial theme

### Navigation System

- **Routing**: React Router v6
- **Keyboard Shortcuts**: Alt+B (back), Alt+M (theme), Alt+V (voice)
- **Accessibility**: ARIA labels, keyboard navigation
- **Transitions**: Smooth page transitions
- **Breadcrumbs**: Semantic HTML with proper ARIA labels

### Component Architecture

- **Structure**:

  ```
  src/
  ├── components/
  │   ├── chat/
  │   └── common/
  ├── context/
  │   └── ThemeContext.tsx
  ├── pages/
  │   ├── Chat.tsx
  │   └── Dashboard.tsx
  └── styles/
      └── index.css
  ```

- **Patterns**:
  - Functional components with hooks
  - Context for global state
  - Custom hooks for reusable logic
  - TypeScript for type safety

## Styling System

### Tailwind Configuration

```javascript
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0078D4",
        background: "#F5F6F7",
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "sans-serif"],
      },
    },
  },
};
```

### CSS Variables

```css
:root {
  color-scheme: light dark;
  color: #333333;
  background-color: #f5f6f7;
}

.dark {
  color-scheme: dark;
  color: #ffffff;
  background-color: #111827;
}
```

### Component Classes

- **Buttons**:

  ```css
  .btn-primary {
    @apply bg-primary text-white hover:bg-primary/90;
  }
  ```

- **Inputs**:
  ```css
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md 
           focus:outline-none focus:ring-2 focus:ring-primary/50 
           focus:border-primary;
  }
  ```

## State Management

### Theme State

```typescript
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
```

### Navigation State

```typescript
interface NavigationState {
  currentPath: string;
  history: string[];
  params: Record<string, string>;
}
```

## Performance Considerations

### Theme Transitions

- CSS transitions for smooth changes
- Proper cleanup of event listeners
- Optimized re-renders
- Efficient color scheme handling

### Navigation Performance

- Client-side routing
- Preloading of common routes
- Optimized event handling
- Proper cleanup of listeners

## Accessibility Features

### Keyboard Navigation

- Alt+B: Back to dashboard
- Alt+M: Toggle theme
- Alt+V: Toggle voice input
- Tab navigation support
- Focus management

### Screen Reader Support

- ARIA labels
- Semantic HTML
- Proper heading structure
- Focus indicators
- Color contrast

## Browser Support

### Theme Features

- System preference detection
- localStorage persistence
- CSS transitions
- Color scheme media queries

### Navigation Features

- History API
- Keyboard events
- Focus management
- ARIA attributes

## Development Tools

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Testing Strategy

### Theme Testing

- System preference detection
- localStorage persistence
- Transition smoothness
- Color contrast ratios
- Accessibility compliance

### Navigation Testing

- Keyboard shortcuts
- Route transitions
- Focus management
- Screen reader compatibility
- Mobile responsiveness

## Deployment Considerations

### Theme System

- CSS optimization
- Bundle size impact
- Cache management
- Performance monitoring

### Navigation System

- Route optimization
- Code splitting
- Performance metrics
- Error tracking

## Frontend Components

### Templates Management

1. **Templates Page** (`src/frontend/src/pages/Templates.tsx`):

   - Role-based access control using Supabase Auth
   - Responsive grid layout with Tailwind CSS
   - Integration with Supabase for template operations

2. **Template Components**:

   - `TemplateList.tsx`: Displays templates with loading/error states
   - `AddTemplateForm.tsx`: Form validation and Supabase integration

3. **Technical Features**:
   - Dark mode support
   - Loading states with spinners
   - Error handling and user feedback
   - Responsive design
   - Accessibility compliance

## Database Schema

### Templates Table

```sql
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Template Documents Junction Table

```sql
CREATE TABLE public.template_documents (
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (template_id, document_id)
);
```

This junction table establishes a many-to-many relationship between templates and documents, allowing templates to reference multiple documents as knowledge sources for generation.

### Access Control

```sql
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read templates
CREATE POLICY "templates_select_policy" 
ON public.templates 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert templates
CREATE POLICY "templates_insert_policy" 
ON public.templates 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update templates
CREATE POLICY "templates_update_policy" 
ON public.templates 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete templates
CREATE POLICY "templates_delete_policy" 
ON public.templates 
FOR DELETE 
TO authenticated
USING (true);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### Templates System

- **Components**:

  - `Templates.tsx`: Main templates page with admin access control
  - `TemplateList.tsx`: Template listing with search and selection
  - `AddTemplateForm.tsx`: Form for creating new templates
  - `EditTemplate.tsx`: Template editing interface

- **Database Schema**:

  ```sql
  CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  ```

- **API Endpoints**:

  ```typescript
  // Template endpoints
  GET    /templates         // List all templates
  POST   /templates         // Create new template
  GET    /templates/:id     // Get template by ID
  PUT    /templates/:id     // Update template
  DELETE /templates/:id     // Delete template
  ```

- **Access Control**:

  ```sql
  -- Role-based access control
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user'
  );
  ```

- **Form Validation**:

  - Name: Required, max 100 characters
  - Description: Optional
  - Unique name constraint
  - Real-time validation feedback

- **Error Handling**:

  - Duplicate name detection
  - Network error handling
  - Loading states
  - Success/error messages

- **UI/UX Features**:
  - Search functionality
  - Responsive grid layout
  - Dark mode support
  - Loading spinners
  - Tooltips for guidance
  - Keyboard navigation

### Document Management

```sql
-- Documents table
CREATE TABLE lexpert.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    tag TEXT DEFAULT 'untagged',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tag ON lexpert.documents(tag);

-- RLS Policies
CREATE POLICY "Admin full access"
    ON lexpert.documents
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can view"
    ON lexpert.documents
    FOR SELECT
    TO authenticated
    USING (true);
```

### Storage Configuration

```sql
-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage RLS Policies
CREATE POLICY "Admin full access storage"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can download"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'documents');
```

## Component Architecture

### Document Management

```typescript
// Document type definition
interface Document {
  id: string;
  name: string;
  path: string;
  tag: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata: Record<string, any>;
}

// File upload handler
const handleFileUpload = async (file: File) => {
  const filePath = `documents/${Date.now()}-${sanitizeFileName(file.name)}`;

  // Upload to storage
  await supabase.storage.from("documents").upload(filePath, file);

  // Store metadata
  await supabase.from("lexpert.documents").insert({
    name: file.name,
    path: filePath,
    tag: "untagged",
  });
};
```

## Security Implementation

### Access Control

1. **Authentication**

   - Supabase Auth for user management
   - JWT-based session handling
   - Role-based access control

2. **Row Level Security**

   - Admin-only write access to documents
   - Authenticated read access for all users
   - Storage bucket policies aligned with document access

3. **File Security**
   - Private storage bucket
   - Sanitized file names
   - File type validation
   - Unique file paths with timestamps

## Development Setup

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_anon_key
```

### Required Dependencies

```json
{
  "@supabase/supabase-js": "latest",
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "tailwindcss": "^3.0.0"
}
```

## Performance Considerations

### Document Upload

1. **File Size**

   - Current: No limit implemented
   - Planned: 10MB limit per file
   - Future: Chunked upload for larger files

2. **Storage Optimization**

   - Timestamp-based file paths
   - Sanitized file names
   - Efficient metadata storage

3. **Query Performance**
   - Index on document tags
   - Optimized RLS policies
   - Efficient file path structure

## Error Handling

### Upload Errors

```typescript
try {
  // Upload logic
} catch (err) {
  if (err instanceof StorageError) {
    // Handle storage-specific errors
  } else if (err instanceof DatabaseError) {
    // Handle database-specific errors
  } else {
    // Handle generic errors
  }
}
```

### Error Types

1. **Storage Errors**

   - File too large
   - Invalid file type
   - Storage quota exceeded
   - Network issues

2. **Database Errors**

   - Constraint violations
   - Permission denied
   - Connection issues

3. **Validation Errors**
   - Invalid file name
   - Unsupported file type
   - Missing required fields

## Testing Strategy

### Unit Tests (Planned)

1. **File Upload**

   - File type validation
   - File name sanitization
   - Error handling

2. **Access Control**

   - Admin role verification
   - Permission checks
   - RLS policy validation

3. **Document Management**
   - CRUD operations
   - Tag management
   - Search functionality

### Integration Tests (Planned)

1. **Storage Integration**

   - File upload flow
   - File retrieval
   - Error scenarios

2. **Database Integration**

   - Document creation
   - Metadata updates
   - Query performance

3. **UI Integration**
   - User interactions
   - Error displays
   - Loading states

## Deployment Considerations

### Storage Configuration

1. **Bucket Setup**

   - Private access
   - RLS enabled
   - Proper policies

2. **File Management**
   - Unique file paths
   - Metadata tracking
   - Cleanup procedures

### Database Setup

1. **Schema Migration**

   - Table creation
   - Index creation
   - RLS policy setup

2. **Access Control**
   - Role configuration
   - Policy verification
   - Permission testing

## Monitoring and Maintenance

### Storage Monitoring

1. **Usage Metrics**

   - Storage utilization
   - Upload frequency
   - Access patterns

2. **Error Tracking**
   - Upload failures
   - Access denials
   - Policy violations

### Database Monitoring

1. **Performance Metrics**

   - Query performance
   - Index usage
   - Connection pool status

2. **Security Auditing**
   - Access logs
   - Policy effectiveness
   - Role assignments

## Frontend Architecture

### React Components

#### Document Management

- **Documents Component**: Main component for document management

  - Handles authentication and admin role verification
  - Provides document upload functionality
  - Displays tagged documents and document library
  - **Status**: Fully functional as of 3/18/2025
  - **Enhancements**:
    - Added detailed logging with DEBUG flag
    - Improved error handling for Supabase operations
    - Added fallback UI for various error states
    - Enhanced loading states with visual feedback
    - Implemented direct Supabase storage uploads
    - Added automatic bucket creation and validation

- **DocumentList Component**: Displays the list of uploaded documents
  - Fetches documents from Supabase
  - Provides document viewing and deletion functionality
  - **Enhancements**:
    - Added comprehensive error handling
    - Improved loading state visualization
    - Added retry functionality for failed operations
    - Enhanced integration with storage service
    - Improved refresh mechanism after uploads

#### Debugging Tools

- **EnvTest Component**: Diagnostic tool for environment variables

  - Displays all VITE\_ prefixed environment variables
  - Masks sensitive values for security
  - Provides debugging information for environment variable issues

- **Debug HTML Files**: Standalone HTML files for testing API connectivity
  - debug-console.html: Enhanced debugging console for testing the Documents page
  - Provides detailed error logging and HTML content analysis

### Environment Variable Management

- **Strategy**: Using Vite's import.meta.env for accessing environment variables
- **Configuration**:
  - Root .env file contains all environment variables
  - Frontend .env file ensures variables are accessible in the Vite application
- **Debugging Utilities**:
  - getEnvVar function with logging and fallbacks
  - Environment test page for visualizing loaded variables
  - Console logging for environment variable loading

## Backend Architecture

### Supabase Integration

- **Authentication**: Using Supabase Auth for user management

  - Email/password authentication
  - Role-based access control (admin vs. regular users)
  - Session management with AuthLayout component

- **Database**: PostgreSQL with pgvector extension

  - Tables:
    - lexpert.documents: Stores document metadata
    - bots: Stores bot configurations
    - messages: Stores chat messages
    - templates: Stores document templates

- **Storage**: Supabase Storage for document files
  - Bucket: 'documents'
  - Public URLs for document viewing
  - Secure upload/delete operations
  - Enhanced storage service with automatic bucket creation
  - Improved error handling for storage operations
  - Direct client-side uploads with proper caching and upsert options

### Error Handling Strategy

- **Frontend**:

  - Component-level error states with user-friendly messages
  - Detailed console logging for debugging
  - Fallback UI for various error scenarios
  - Retry mechanisms for failed operations
  - Enhanced StorageError type handling
  - Improved bucket existence checks and error detection
  - User-friendly feedback for upload operations

- **Backend**:
  - Try-catch blocks for all Supabase operations
  - Detailed error logging with context
  - Graceful degradation for service failures

## Development Environment

### Tools

- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety for JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase Client**: JavaScript client for Supabase services

### Environment Variables

- **VITE_SUPABASE_URL**: Supabase project URL
- **VITE_SUPABASE_KEY**: Supabase anon key
- **ANTHROPIC_API_KEY**: API key for Anthropic Claude
- **OPENAI_API_KEY**: API key for OpenAI GPT models
- **REDIS_URL**: URL for Redis caching (optional)

## Debugging Techniques

### Console Logging

- **DEBUG Flags**: Boolean flags to enable/disable detailed logging
- **Component-specific Logging**: Prefixed logs for easier identification
- **Environment Variable Logging**: Masked logging of sensitive values

### Error Handling

- **Try-Catch Blocks**: Comprehensive error catching
- **Error States**: Component-level error state management
- **User Feedback**: Clear error messages for end users
- **Fallback Mechanisms**: Graceful degradation when services fail

### Testing Tools

- **Standalone HTML Files**: For testing API connectivity
- **Environment Test Page**: For verifying environment variables
- **Direct API Testing**: For confirming Supabase connectivity
