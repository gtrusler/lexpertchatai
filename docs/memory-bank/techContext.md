# Technical Context - Lexpert Case AI

This document outlines the technologies used, development setup, technical constraints, and dependencies for the Lexpert Case AI project.

## Technologies Used

### Frontend

| Technology     | Version     | Purpose                                                |
| -------------- | ----------- | ------------------------------------------------------ |
| React.js       | 18.x        | UI library for building component-based interfaces     |
| TypeScript     | 4.9+        | Type-safe JavaScript for improved developer experience |
| Tailwind CSS   | 3.x         | Utility-first CSS framework for styling                |
| React Router   | 6.x         | Client-side routing for single-page application        |
| Heroicons      | 2.x         | Icon set for UI elements                               |
| Web Speech API | Browser API | Voice recognition for voice commands                   |

### Backend

| Technology                | Version | Purpose                                              |
| ------------------------- | ------- | ---------------------------------------------------- |
| Python                    | 3.10+   | Primary backend language                             |
| FastAPI/Flask             | Latest  | API framework for backend services                   |
| LangChain                 | Latest  | Framework for building LLM applications              |
| LlamaIndex                | Latest  | Data framework for LLM context augmentation          |
| spaCy                     | Latest  | NLP library for document processing and auto-tagging |
| Hugging Face Transformers | Latest  | ML models for NLP tasks                              |

### Database & Storage

| Technology | Version  | Purpose                                               |
| ---------- | -------- | ----------------------------------------------------- |
| Supabase   | Latest   | Backend-as-a-Service for auth, database, and storage  |
| PostgreSQL | 14+      | Relational database for structured data               |
| pgvector   | Latest   | Vector extension for PostgreSQL for similarity search |
| Redis      | Optional | Caching layer for performance optimization            |

### AI Models

| Technology                  | Version  | Purpose                                  |
| --------------------------- | -------- | ---------------------------------------- |
| OpenAI GPT-4o               | Latest   | Primary LLM for text generation          |
| Anthropic Claude 3.5 Sonnet | Latest   | Alternative LLM for text generation      |
| xAI Grok                    | Optional | Optional alternative LLM                 |
| OpenAI Embeddings           | Latest   | Vector embeddings for document retrieval |

## Development Setup

### Environment Setup

1. **Conda Environment**

   ```bash
   conda create -n lexpert_case_ai python=3.10
   conda activate lexpert_case_ai
   ```

2. **Frontend Dependencies**

   ```bash
   cd src/frontend
   npm install
   ```

3. **Backend Dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   - Create `.env` file in the backend directory with:
     ```
     OPENAI_API_KEY=your_openai_key
     ANTHROPIC_API_KEY=your_anthropic_key
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     ```
   - Create `.env.local` file in the frontend directory with:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

### Running the Application

1. **Frontend**

   ```bash
   conda activate lexpert_case_ai
   cd src/frontend
   npm run dev
   ```

2. **Backend**
   ```bash
   conda activate lexpert_case_ai
   cd backend
   uvicorn main:app --reload
   ```

### Project Structure

```
lexpertcaseai/
├── backend/
│   ├── main.py                # FastAPI entry point
│   ├── requirements.txt       # Python dependencies
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── core/              # Core functionality
│   │   │   ├── models/            # Data models
│   │   │   ├── services/          # Business logic
│   │   │   └── utils/             # Utility functions
│   │   └── tests/                 # Backend tests
├── src/
│   ├── frontend/              # Frontend code
│   │   ├── public/            # Static assets
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── context/       # React context providers
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── pages/         # Page components
│   │   │   ├── services/      # API services
│   │   │   ├── types/         # TypeScript types
│   │   │   ├── utils/         # Utility functions
│   │   │   ├── App.tsx        # Main App component
│   │   │   └── index.tsx      # Entry point
│   │   ├── package.json       # NPM dependencies
│   │   └── tailwind.config.js # Tailwind configuration
│   └── components/            # Legacy components (to be migrated)
└── docs/                      # Documentation
    ├── memory-bank/           # Memory bank documentation
    ├── recent-changes.md      # Recent changes log
    └── checkpoint.md          # Project checkpoint
```

## Technical Constraints

### Performance Requirements

1. **Response Time**

   - 3-5 seconds for RAG operations during trials
   - 3-6 seconds for typical operations
   - < 1 second for UI interactions

2. **Scalability**

   - Support for 100+ cases per user
   - Handle 1GB+ of documents
   - Support 50+ concurrent users

3. **Accuracy**
   - 95% accuracy in legal citations
   - No hallucinations in generated content
   - No retrieval loops

### Browser Compatibility

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Android Chrome)

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## Dependencies

### Frontend Dependencies

Key dependencies include:

- **react**: Core UI library
- **react-dom**: DOM rendering for React
- **react-router-dom**: Routing
- **@heroicons/react**: Icon set
- **@supabase/supabase-js**: Supabase client
- **tailwindcss**: CSS framework
- **typescript**: Type checking

### Backend Dependencies

Key dependencies include:

- **fastapi/flask**: API framework
- **langchain**: LLM framework
- **llama-index**: RAG framework
- **openai**: OpenAI API client
- **anthropic**: Anthropic API client
- **supabase**: Supabase client
- **spacy**: NLP processing
- **transformers**: Hugging Face models
- **pgvector**: Vector database extension
- **redis**: Optional caching

## API Integrations

### OpenAI

- **Endpoints Used**:
  - Chat Completions API
  - Embeddings API
- **Rate Limits**: Managed through token budgeting
- **Authentication**: API key

### Anthropic

- **Endpoints Used**:
  - Claude API
- **Rate Limits**: Managed through token budgeting
- **Authentication**: API key

### Supabase

- **Services Used**:
  - Authentication
  - Database
  - Storage
  - Vector Store (pgvector)
- **Authentication**: JWT tokens

## Deployment Considerations

### Infrastructure

- **Frontend**: Vercel/Netlify for static hosting
- **Backend**: Cloud provider (AWS, GCP, Azure)
- **Database**: Supabase managed PostgreSQL

### Security

- **Authentication**: Supabase Auth with JWT
- **Data Encryption**: Encrypted storage for sensitive documents
- **API Security**: Rate limiting, CORS, input validation

### Monitoring

- **Error Tracking**: Planned integration with error tracking service
- **Performance Monitoring**: Planned integration with APM service
- **Usage Analytics**: Planned integration with analytics service

This technical context provides a comprehensive overview of the technologies, setup, and constraints for the Lexpert Case AI project, serving as a reference for development decisions and onboarding new team members.
