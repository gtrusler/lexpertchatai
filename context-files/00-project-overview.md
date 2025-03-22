# Lexpert Case AI - Project Overview

## Core Purpose

Lexpert Case AI is a Retrieval-Augmented Generation (RAG) chatbot designed specifically for attorneys. The system enables legal professionals to efficiently draft legal documents, cite relevant laws, and handle case-specific document uploads.

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

## Development Phases

1. **Prototype (Week 1):** Implement basic RAG with Supabase VectorDB, create Streamlit chat UI
2. **Core Features (Weeks 2-3):** Design wizard, enhance prompt coach, refine sourcing
3. **Polish and Scale (Weeks 4-6):** Optimize for performance, redesign UI in React/Tailwind, market to Austin lawyers

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
