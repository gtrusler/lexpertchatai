# Lexpert Case AI - Technical Stack and Architecture

This document outlines the key technical decisions and architectural approach for the Lexpert Case AI project.

## Core Architecture

The application follows a modern client-server architecture with:

- **Frontend**: React SPA with TypeScript
- **Backend**: FastAPI Python server
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI API

## Frontend Architecture

### Framework and Core Libraries

- **React** (18.x) - Core UI library
- **TypeScript** (5.x) - Static typing
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** (6.x) - Client-side routing
- **Supabase JS Client** - Database and auth integration
- **React Query** - Data fetching and caching

### Key Architectural Decisions

1. **Component Structure**:

   - Container components for state and logic
   - Presentational components for UI rendering
   - Custom hooks for reusable logic
   - Context providers for global state

2. **Routing Strategy**:

   - Public routes for landing and authentication
   - Protected routes for authenticated content
   - Lazy loading for performance optimization

3. **State Management**:

   - React Query for server state
   - Context API for global UI state
   - Local component state for component-specific UI

4. **Styling Approach**:

   - Tailwind CSS for utility-first styling
   - Custom component libraries built on Tailwind
   - Dark mode support with `dark:` variants
   - Responsive design with mobile-first approach

5. **Form Handling**:

   - Form validation with schema validation
   - Controlled components for form inputs
   - Custom form hooks for reusable logic

6. **Error Handling**:

   - Centralized error boundary at app root
   - Component-level error states
   - Toast notifications for user feedback
   - Consistent error logging to console

7. **ID Handling Strategy**:
   - UUIDs used for all database records
   - Special handling for bot IDs (numeric) vs chat IDs (UUIDs)
   - Deterministic UUID generation for numeric bot IDs: `00000000-0000-0000-0000-{padded_bot_id}`
   - Components consistently check ID format and apply appropriate logic

## Backend Architecture

### Framework and Core Libraries

- **FastAPI** - Modern, high-performance web framework
- **Pydantic** - Data validation and settings management
- **SQLAlchemy** - SQL toolkit and ORM
- **Alembic** - Database migrations
- **Uvicorn** - ASGI server
- **Python-Jose** - JWT token handling
- **OpenAI Python** - AI model integration

### Key Architectural Decisions

1. **API Structure**:

   - RESTful API design
   - Versioned endpoints
   - Swagger/OpenAPI documentation
   - JWT authentication

2. **Service Layer**:

   - Separation of concerns with clear boundaries
   - Business logic isolated in service classes
   - Database operations abstracted in repositories
   - AI integration through dedicated services

3. **Error Handling**:

   - Standardized error responses
   - Detailed error logging
   - Custom exception handlers
   - Graceful degradation strategies

4. **Authentication Flow**:

   - JWT tokens for session management
   - Role-based access control
   - Secure password hashing
   - Token refresh mechanism

5. **Performance Optimization**:
   - Async/await for non-blocking I/O
   - Connection pooling for database
   - Response caching where appropriate
   - Background tasks for heavy operations

## Database Architecture

### Structure and Technology

- **PostgreSQL** - Relational database
- **Supabase** - Postgres with RESTful and realtime APIs
- **Row Level Security** - For data protection and multi-tenancy
- **PostgREST** - RESTful API automatically generated from schema
- **Real-time subscriptions** - For live updates

### Key Tables

- **users** - User accounts (managed by Supabase Auth)
- **chats** - Chat sessions with UUID IDs
- **documents** - Uploaded files and text content
- **templates** - Document templates
- **template_documents** - Junction table for template-document relationships
- **document_tags** - Tags for documents
- **tag_hierarchy** - Hierarchical organization of tags

### Security Approach

- **Row Level Security Policies**:

  - Table-level policies controlling CRUD operations
  - Policy-based access control for multi-tenant data
  - Specific RLS policies for documents and chats tables
  - Authentication required for all data operations

- **Authentication Integration**:
  - Supabase Auth for user management
  - JWT tokens for session control
  - Secure password reset flows
  - Social login options

## Storage Architecture

- **Supabase Storage** - Object storage for files
- **Bucket Structure**:
  - `documents` - User-uploaded documents
  - `templates` - Template-related files
  - `profile` - User profile images and files
- **Access Control**:
  - Bucket-level permissions
  - File-level metadata
  - Signed URLs for secure access

## CI/CD Architecture

- **GitHub Actions** - Automated testing, building, and deployment
- **Workflows**:
  - PR checks for code quality
  - Automated tests on PR and main branch commits
  - Build and deployment to staging on PR merge
  - Production deployment through manual approval

## Monitoring and Logging

- **Application Logging**:

  - Structured logging with levels
  - Request/response logging
  - Error tracking
  - Performance metrics

- **Monitoring Strategy**:
  - API endpoint health checks
  - Performance monitoring
  - Error rate alerting
  - User activity dashboards

## Testing Strategy

- **Frontend**:

  - Jest for unit testing
  - React Testing Library for component tests
  - Cypress for E2E tests
  - Storybook for component documentation

- **Backend**:
  - Pytest for unit and integration tests
  - Test database fixtures
  - Mocked external services
  - API contract testing

## Security Considerations

- **Data Protection**:

  - End-to-end encryption for sensitive data
  - Secure password storage (bcrypt)
  - Content security policies
  - Regular security audits

- **API Security**:
  - Rate limiting
  - CORS configuration
  - Input validation and sanitization
  - API key rotation

## Performance Optimization

- **Frontend**:

  - Code splitting and lazy loading
  - Image optimization
  - Bundle size analysis and optimization
  - Cache strategies (SWR/React Query)

- **Backend**:
  - Database query optimization
  - Connection pooling
  - Caching layers
  - Async processing for heavy tasks

## Integration Points

- **OpenAI API**:

  - Model: GPT-4
  - Usage: Chat responses, document analysis
  - Integration via official Python SDK
  - Prompt engineering and context management

- **Supabase Services**:
  - Database: PostgreSQL storage
  - Auth: User management and authentication
  - Storage: File storage and management
  - Realtime: Live updates via subscriptions

## Deployment Architecture

- **Frontend**:

  - Static hosting on Vercel/Netlify
  - CDN for global distribution
  - Environment-specific builds
  - Feature flags for incremental rollout

- **Backend**:
  - Containerized deployment with Docker
  - Kubernetes for orchestration
  - Autoscaling based on load
  - Blue/green deployments for zero downtime

## Environment Configuration

- **Development**: Local environment with hot reloading
- **Testing**: Isolated environment for automated tests
- **Staging**: Pre-production for QA and validation
- **Production**: Live environment with scaled resources

## Documentation Strategy

- **Code Documentation**:

  - JSDoc for JavaScript/TypeScript
  - Python docstrings
  - Clear function and variable naming
  - Comments for complex logic

- **API Documentation**:

  - OpenAPI/Swagger for endpoint documentation
  - Example requests and responses
  - Authentication documentation
  - Rate limit information

- **User Documentation**:
  - User guides
  - FAQ section
  - Video tutorials
  - Contextual help
