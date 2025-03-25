# Lexpert Case AI - Project Overview

## Core Purpose

Lexpert Case AI is a Retrieval-Augmented Generation (RAG) chatbot designed specifically for attorneys. The system enables legal professionals to efficiently draft legal documents, cite relevant laws, and handle case-specific document uploads.

## Implementation Philosophy

Lexpert Case AI is designed to use real AI services rather than simulations or mock data. The application integrates directly with OpenAI's API for:

- Chat completions (using GPT-4o model)
- Document embeddings (using text-embedding-3-small model)
- RAG contexts and information retrieval

**Important**: We do not use mock data or hardcoded responses. All AI interactions must use the real OpenAI API unless explicitly approved for testing purposes only.

## Requirements

### Performance Targets

- **Response Time:** 3-5 seconds for mid-trial queries, 3-6 seconds typical
- **Accuracy:** 95% with no hallucinations and reliable source citations
- **Scalability:** Handle 100+ cases, 1GB+ documents, and 50+ concurrent users

### User Experience

- **Interface:** Clean, professional UI with deep blue (#0078D4) headers/buttons, white cards, light gray (#F5F6F7) background
- **Accessibility:** Mobile-responsive, ADA-compliant, keyboard shortcuts
- **Workflow:** Handle chaotic, shorthand prompts via auto-tagging and real-time prompt coaching

## Project Goals

1. Deliver fast (3-5s), reliable, sourced outputs that can be used mid-trial
2. Handle chaotic, shorthand prompts through intelligent auto-tagging and prompt coaching
3. Ensure scalability for 100+ cases, 1GB+ documents, and marketability to Austin lawyers
4. Future-proof for agentic RAG and cross-domain use (family law, trademarks)
5. Use real AI services throughout - no mock data or hardcoded responses

## Development Phases

1. **Core Infrastructure (Completed)**

   - Implemented basic RAG with Supabase VectorDB
   - Set up React/Tailwind frontend with dark mode
   - Established modular backend structure
   - Configured Supabase storage and authentication

2. **Document Management (Completed)**

   - Implemented document upload and storage
   - Added automatic document processing
   - Created document search and retrieval
   - Enhanced error handling and user feedback

3. **Templates System (In Progress)**

   - Created templates table with enhanced metadata
   - Implemented template-document connections
   - Added role-based access control
   - Enhanced search and filtering capabilities

4. **Chat Interface (In Progress)**

   - Implemented real-time chat with AI
   - Added document citation support
   - Enhanced context-aware responses
   - Improved error handling and feedback

5. **Polish and Optimization (Planned)**
   - Performance optimization for large document sets
   - Enhanced error recovery mechanisms
   - Improved user experience and accessibility
   - Cross-browser testing and compatibility

## Key Features

### Document Management

- Upload and manage legal documents
- Automatic document processing and embedding
- Document search and retrieval

### Templates System

- Create and manage document templates with enhanced metadata:
  - Case history background information
  - Participant details
  - Template objectives
  - AI generation prompts
- Template-document connections for knowledge sources
- Role-based access control for templates
- Search and filtering capabilities across all template fields

### Chat Interface

- Real-time chat with AI assistants
- Document citation and reference
- Context-aware responses

### User Management

- Role-based access control
- User profiles and preferences
- Authentication via Supabase Auth
