# System Patterns - Lexpert Case AI

This document outlines the system architecture, key technical decisions, design patterns, and component relationships for the Lexpert Case AI project.

## System Architecture

Lexpert Case AI follows a modern web application architecture with clear separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  FastAPI/Flask  │────▶│    Supabase     │
│                 │     │     Backend     │     │  (PostgreSQL)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   UI Components │     │  LangChain/     │     │    pgvector     │
│   (React/       │     │  LlamaIndex     │     │  (Vector Store) │
│    Tailwind)    │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                │
                                ▼
                        ┌─────────────────┐
                        │                 │
                        │   OpenAI/       │
                        │   Anthropic     │
                        │                 │
                        └─────────────────┘
```

### Key Components

1. **Frontend Layer**

   - React.js with TypeScript for type safety
   - Tailwind CSS for styling
   - Component-based architecture
   - Context API for state management

2. **Backend Layer**

   - FastAPI/Flask for API endpoints
   - LangChain/LlamaIndex for RAG implementation
   - spaCy/Hugging Face for NLP tasks (auto-tagging)
   - Redis (optional) for caching

3. **Data Layer**

   - Supabase for authentication, storage, and database
   - PostgreSQL with pgvector for vector storage
   - Supabase Storage for document files

4. **External Services**
   - OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet for LLM capabilities
   - Optional xAI Grok integration

## Key Technical Decisions

### 1. RAG Implementation

We've chosen a Retrieval-Augmented Generation approach with the following characteristics:

- **Document Processing**

  - Chunk legal documents into 500-token segments
  - Create embeddings using OpenAI/Anthropic models
  - Store vectors in pgvector for efficient retrieval

- **Retrieval Strategy**

  - Two-layer approach: base layer (legal codes) and case layer (case-specific documents)
  - Hybrid search combining semantic similarity and keyword matching
  - Re-ranking of results based on relevance

- **Generation Approach**
  - Prompt engineering with specific legal context
  - Include retrieved documents as context
  - Enforce citation requirements

### 2. Frontend Architecture

We've implemented a component-based architecture with:

- **Page Components**

  - Dashboard: Main entry point showing assistants and templates
  - Chat: Conversation interface with message history and input
  - Wizard: Step-by-step case creation flow

- **Common Components**

  - Card: Reusable card component for displaying information
  - Button: Styled button components with variants
  - Input: Form input components
  - FileUpload: Document upload component
  - Tooltip: Context-sensitive help

- **Layout Components**
  - AuthLayout: Wrapper for authenticated pages
  - Header: Navigation and user controls
  - Sidebar: Collapsible sidebar for additional information

### 3. State Management

We've chosen a combination of state management approaches:

- **Local Component State**

  - useState for component-specific state
  - useReducer for more complex state logic

- **Context API**

  - ThemeContext for dark/light mode
  - AuthContext for user authentication
  - (Planned) AssistantContext for current assistant data

- **Server State**
  - Supabase for data persistence
  - (Planned) React Query for server state management

### 4. Authentication and Security

We've implemented security measures including:

- **Authentication**

  - Supabase Auth for user management
  - JWT-based authentication
  - Protected routes requiring authentication

- **Data Security**
  - Private projects by default
  - Encrypted document storage
  - Row-level security in Supabase

## Design Patterns

### 1. Component Patterns

- **Compound Components**

  - Form elements with labels, validation, and error states
  - Card components with headers, bodies, and footers

- **Render Props**

  - Used for complex components that need to share logic
  - Implemented in FileUpload and other interactive components

- **Custom Hooks**
  - useTheme for dark mode management
  - useAuth for authentication state
  - useChatHistory for message management

### 2. State Management Patterns

- **Reducer Pattern**

  - Used for complex state management in Chat component
  - Handles message history, loading states, and errors

- **Context + Reducer**
  - Combined for application-wide state
  - Provides both state and actions to components

### 3. API Interaction Patterns

- **Repository Pattern**

  - Abstraction layer for API calls
  - Centralized error handling and response formatting

- **Service Layer**
  - Business logic separated from components
  - Reusable services for common operations

## Component Relationships

### Dashboard Flow

```
AuthLayout
└── Dashboard
    ├── Header
    │   ├── ThemeToggle
    │   ├── VoiceToggle
    │   └── LogoutButton
    ├── AssistantGrid
    │   └── Card (for each assistant)
    └── TemplateGrid
        └── Card (for each template)
```

### Chat Flow

```
AuthLayout
└── Chat
    ├── Header
    │   ├── ReturnButton
    │   ├── Breadcrumb
    │   ├── ThemeToggle
    │   └── VoiceToggle
    ├── MessageList
    │   └── Message (for each message)
    ├── InputArea
    │   ├── TextInput
    │   ├── SendButton
    │   └── FileUpload
    └── Sidebar (optional)
        └── Memory
```

### Wizard Flow

```
AuthLayout
└── Wizard
    ├── Header
    ├── StepIndicator
    ├── StepContent
    │   ├── TemplateSelection (Step 1)
    │   ├── BasicInfo (Step 2)
    │   ├── DocumentUpload (Step 3)
    │   └── Confirmation (Step 4)
    └── NavigationButtons
```

## Data Flow

1. **User Authentication**

   - User logs in via Supabase Auth
   - JWT token stored in local storage
   - AuthContext updated with user information

2. **Assistant Creation**

   - User selects template and provides information
   - Documents uploaded to Supabase Storage
   - Backend processes documents and creates embeddings
   - Assistant record created in database

3. **Chat Interaction**
   - User sends message to assistant
   - Message stored in database
   - Backend retrieves relevant documents
   - LLM generates response with citations
   - Response stored and displayed to user

This architecture and these patterns provide a solid foundation for the Lexpert Case AI application, ensuring scalability, maintainability, and performance as the project grows.
