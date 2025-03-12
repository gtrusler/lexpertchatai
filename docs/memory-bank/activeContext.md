# Active Context - Lexpert Case AI

This document captures the current focus of development, recent changes, and active decisions for the Lexpert Case AI project.

## Current Focus

We are currently focused on building the frontend UI components and ensuring proper navigation and user experience. The main areas of focus are:

1. **UI/UX Implementation**

   - Building responsive and accessible UI components
   - Implementing dark mode and theme switching
   - Ensuring proper navigation between screens
   - Fixing clickability issues with interactive elements

2. **Mock Data Integration**

   - Using mock data to simulate backend functionality
   - Preparing for real backend integration
   - Testing UI components with realistic data

3. **Documentation**
   - Maintaining up-to-date documentation of changes
   - Creating checkpoints to track progress
   - Documenting project structure and setup instructions

## Recent Changes

### UI Simplification and Terminology Updates (Feb 27, 2024)

- Changed terminology from "bots" to "assistants" throughout the application
- Removed "Bot" from template names (e.g., "Texas Family Code" instead of "Texas Family Code Bot")
- Simplified the Dashboard by removing redundant elements
- Added a prominent "Return to Dashboard" button in the Chat interface
- Added breadcrumb navigation in the Chat interface for better context

### Dark Mode Implementation (Feb 27, 2024)

- Created a ThemeContext to manage dark mode state across the application
- Added a toggle button with moon/sun icons in the Chat and Dashboard interfaces
- Implemented localStorage persistence for user preferences
- Configured Tailwind CSS for dark mode support with the 'class' strategy
- Added proper CSS classes for dark mode styling in index.css
- Fixed dark mode toggle functionality to properly apply styles to all components

### Navigation Improvements (Feb 26-27, 2024)

- Added a prominent "Return to Dashboard" button in the navigation header
- Implemented breadcrumb navigation to show the current location
- Ensuring proper routing between dashboard and chat interfaces
- Fixed issues with clickable elements in the Dashboard
- Improved keyboard accessibility with tabIndex and onKeyDown handlers

## Active Decisions

### Architecture Decisions

1. **State Management**

   - Using React Context for theme management
   - Planning to use Supabase for backend data
   - Considering more robust state management for complex features

2. **Component Structure**

   - Breaking down large components into smaller, reusable ones
   - Using common components for UI elements (Card, Button, etc.)
   - Implementing layouts for consistent page structure

3. **Styling Approach**
   - Using Tailwind CSS for styling
   - Implementing dark mode with class strategy
   - Using consistent color scheme based on design requirements

### Technical Considerations

1. **Performance**

   - Targeting 3-5s response times for RAG operations
   - Planning to implement caching for frequently accessed data
   - Optimizing component rendering with memoization

2. **Accessibility**

   - Ensuring ARIA labels on all interactive elements
   - Implementing keyboard navigation
   - Maintaining proper color contrast

3. **Security**
   - Planning to implement proper authentication with Supabase
   - Ensuring secure file uploads and storage
   - Implementing proper permission checks

## Next Steps

1. **Backend Integration**

   - Connect to Supabase for authentication
   - Implement actual data fetching for assistants and templates
   - Store and retrieve chat history

2. **File Processing**

   - Implement file upload to Supabase Storage
   - Connect to NLP services for auto-tagging
   - Implement document chunking for RAG

3. **RAG Implementation**
   - Connect to OpenAI/Anthropic APIs
   - Implement vector search with pgvector
   - Add source attribution and citation

## Open Questions

1. How should we handle authentication for multiple users?
2. What is the optimal chunking strategy for legal documents?
3. How should we implement the prompt coaching feature?
4. What metrics should we track for performance monitoring?
5. How should we handle rate limiting and API quotas?
