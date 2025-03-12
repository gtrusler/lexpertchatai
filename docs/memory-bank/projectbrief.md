# Project Brief - Lexpert Case AI

## Project Overview

Lexpert Case AI is a Retrieval-Augmented Generation (RAG) chatbot designed specifically for family law and trademark attorneys. The system enables legal professionals to draft legal documents, cite relevant laws, and handle case-specific document uploads with high accuracy and speed.

## Core Requirements

1. **Performance**

   - Deliver fast (3-5s) responses, even during trial
   - Achieve 95% accuracy in legal citations and document generation
   - Handle chaotic, shorthand prompts via auto-tagging and real-time prompt coaching
   - Ensure scalability for 100+ cases, 1GB+ documents, and 50+ concurrent users

2. **User Experience**

   - Provide a clean, intuitive interface with CodeGuide-style UI
   - Use deep blue (#0078D4) as primary color, with white cards and light gray (#F5F6F7) background
   - Enable seamless document uploads and processing
   - Implement real-time prompt coaching for better query formulation
   - Support voice commands for hands-free operation

3. **Technical Requirements**
   - Implement Retrieval-Augmented Generation (RAG) for accurate legal responses
   - Support multiple document formats for case uploads
   - Provide proper source attribution for all generated content
   - Ensure data privacy and security for sensitive legal documents
   - Future-proof for agentic RAG and cross-domain use

## Target Users

The primary users of Lexpert Case AI are:

- Family law attorneys (e.g., Cristi in Austin, TX)
- Trademark attorneys
- Legal professionals who need to draft documents and cite laws during trials

## Success Criteria

1. **Performance Metrics**

   - Response time: 3-5s for mid-trial queries, 3-6s typical
   - Accuracy: 95% (no hallucinations, no retrieval loops)
   - Scalability: Handle 100+ cases, 1GB+ documents, 50+ concurrent users

2. **User Satisfaction**

   - Intuitive for tech-averse users
   - Less than 5 clicks for core tasks
   - 90% satisfaction rate in user testing

3. **Technical Achievement**
   - Successful integration with Supabase for data storage and retrieval
   - Effective implementation of RAG with proper source attribution
   - Seamless document processing and auto-tagging

## Project Constraints

1. **Technical Constraints**

   - Languages: Python, JavaScript/TypeScript
   - Frameworks: LangChain, LlamaIndex, FastAPI/Flask, React.js + Tailwind CSS
   - Databases: Supabase (PostgreSQL with pgvector for VectorDB)
   - AI Models: OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, optional xAI Grok

2. **Timeline Constraints**

   - Prototype: Week 1 (Feb 23–Mar 1, 2025)
   - Core Features: Weeks 2–3
   - Polish and Scale: Weeks 4–6

3. **Resource Constraints**
   - Development Tools: Cursor (AI coding in VS Code), optional WinSurf/CodeGuide Starter Pro
   - Infrastructure: Supabase for backend, optional Redis for caching

## Project Scope

### In Scope

- RAG chatbot for legal document drafting and law citation
- Document upload and processing functionality
- Auto-tagging of legal documents
- Real-time prompt coaching
- Voice command support
- Dark/light mode toggle
- Source attribution for generated content

### Out of Scope

- Full document management system
- Legal research beyond uploaded documents
- Court filing integration
- Billing or time tracking features
- Multi-language support (initial version English only)

## Future Expansion

- Multi-agent workflows for complex legal tasks
- Cross-domain knowledge integration
- Advanced agentic RAG capabilities
- Team collaboration features
- Analytics and performance tracking

This project brief serves as the foundation for all development work on the Lexpert Case AI project and should be referenced when making key decisions about features, architecture, and implementation details.
