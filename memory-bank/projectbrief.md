# Lexpert Case AI - Project Brief

## Project Overview

Lexpert Case AI is a Retrieval-Augmented Generation (RAG) chatbot designed specifically for attorneys. The system enables legal professionals like Cristi in Austin, TX to efficiently draft legal documents, cite relevant laws, and handle case-specific document uploads.

## Core Requirements

### Performance Targets

- **Response Time:** 3-5 seconds for mid-trial queries, 3-6 seconds typical
- **Accuracy:** 95% with no hallucinations and reliable source citations
- **Scalability:** Handle 100+ cases, 1GB+ documents, and 50+ concurrent users

### User Experience

- **Interface:** Clean, professional UI with deep blue (#0078D4) headers/buttons, white cards, light gray (#F5F6F7) background
- **Accessibility:** Mobile-responsive, ADA-compliant, keyboard shortcuts
- **Workflow:** Handle chaotic, shorthand prompts via auto-tagging and real-time prompt coaching

## Technical Stack

### Frontend

- **Primary:** React.js with TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom Card, Button, Tooltip, LoadingSpinner, and FileUpload components
- **State Management:** React Context API (ThemeContext for dark/light mode)

### Backend

- **Framework:** FastAPI
- **AI Integration:** OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet
- **NLP Processing:** spaCy/Hugging Face for auto-tagging
- **Database:** Supabase (PostgreSQL with pgvector for VectorDB)

## Project Goals

1. Deliver fast (3-5s), reliable, sourced outputs that can be used mid-trial
2. Handle chaotic, shorthand prompts through intelligent auto-tagging and prompt coaching
3. Ensure scalability for 100+ cases, 1GB+ documents, and marketability to Austin lawyers
4. Future-proof for agentic RAG and cross-domain use (family law, trademarks)

## Development Phases

1. **Prototype (Week 1):** Implement basic RAG with Supabase VectorDB, create Streamlit chat UI
2. **Core Features (Weeks 2-3):** Design wizard, enhance prompt coach, refine sourcing
3. **Polish and Scale (Weeks 4-6):** Optimize for performance, redesign UI in React/Tailwind, market to Austin lawyers

## Success Criteria

- **Speed:** 3-5s mid-trial, 3-6s typical, no delays >5s
- **Accuracy:** 95% (correct legal citations, no hallucinations)
- **Usability:** Intuitive for tech-averse users, <5 clicks for core tasks, 90% satisfaction
- **Scalability:** Handle 50+ docs, 10 users in Week 4, 100+ cases, 1GB+ docs by Week 6
