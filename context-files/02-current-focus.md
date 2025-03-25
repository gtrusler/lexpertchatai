# Lexpert Case AI - Current Focus

## Current Work Focus

The current development focus is on implementing and enhancing the Templates feature, along with ongoing UI improvements and bug fixes. Recent work has focused on fixing template-document connections, improving error handling throughout the application, and ensuring live AI integration rather than mock responses.

## Active Tasks

### Live AI Integration (Updated 3/24/2025)

- **Real OpenAI Integration**:
  - Removed mock hardcoded responses in chat service
  - Implemented proper OpenAI API integration
  - Ensuring all AI responses come from actual OpenAI models
  - Using environment variables for API key management
  - Improved error handling for API calls
  - Added system context based on selected bot

### Templates Feature Enhancement

- **Template-Document Connections (Updated 3/21/2025)**:

  - Created a `template_documents` junction table with:
    - `template_id`: UUID (references templates.id with CASCADE delete)
    - `document_id`: UUID
    - `created_at`: TIMESTAMP WITH TIME ZONE (default now())
    - Primary key on (template_id, document_id)
  - This enables many-to-many relationships between templates and documents
  - Enhanced frontend components to support document selection for templates
  - Fixed error handling when template_documents table doesn't exist
  - Improved user feedback with detailed error messages
  - Added robust error recovery to preserve template updates even when document connections fail

- **Templates Table Updates**:
  - Added `prompt` field to store generation prompts for templates
  - Added `case_history` field to store case background information
  - Added `participants` field to store information about case participants
  - Added `objective` field to store the template's intended purpose
  - Enhanced form validation and user feedback
  - Implemented search and filtering capabilities
  - Added loading states and error handling

### Document Upload Functionality

- **Fixed Issues (3/18/2025)**:

  - Enhanced storage service with comprehensive error handling
  - Implemented automatic bucket creation and validation
  - Added proper error detection for "bucket already exists" scenarios
  - Improved file upload options with caching and upsert capabilities
  - Added detailed logging for debugging

- **Unified Upload Approach**:
  - Both Chat.tsx and Documents.tsx now use the same storage service
  - Removed the backend API dependency for file uploads in Documents.tsx
  - Simplified the upload process by handling everything client-side
  - Improved error handling and user feedback

### Backend Refactoring

- **Modular Structure Implementation (3/19/2025)**:
  - Created separate modules for routes, services, and models
  - Implemented clean separation of concerns
  - Moved from a single main.py to a structured application
  - Enhanced error handling and response consistency
  - Added proper documentation for each endpoint

### Current Debugging Focus

- **Documents Page Blank Screen Issue**:
  - Checking Supabase connectivity and environment variables
  - Verifying template_documents junction table
  - Monitoring browser console during operations

## Recent Changes

### 1. Implemented Live AI Integration (3/24/2025)

- Replaced mock chat service with real OpenAI integration:
  - Created dedicated ai_service.py to handle OpenAI API calls
  - Updated chat routes to use the real AI service
  - Added proper error handling for API failures
  - Enhanced system prompts based on bot context
  - Ensured OpenAI API key is properly configured in environment
  - No more hardcoded mock responses - all responses now come from actual AI models

### 2. Improved Testing Framework (3/28/2025)

- Fixed environmental variable handling in tests to work consistently:
  - Created a flexible env.ts module that works in both Jest and Vite environments
  - Properly handled the import.meta.env case for Vite and process.env for Jest
- Enhanced DocumentProcessingService tests:
  - Implemented complete mocks to avoid actual API calls
  - Used hard-coded values instead of trying to read from File objects
  - Fixed issues with file.text() and file.arrayBuffer() methods
  - Added performance testing for document processing operations
- Updated Jest configuration:
  - Configured ts-jest properly to handle TypeScript and ESM imports
  - Removed deprecated globals configuration
  - Added esModuleInterop flag to TypeScript configuration
  - Enhanced test coverage settings
- Fixed all test failures and warnings

### 3. Extended Templates Table Schema (3/21/2025)

- Added additional fields to templates table:
  - `case_history` field to store case background information
  - `participants` field to store information about case participants
  - `objective` field to store the template's intended purpose
- Updated frontend components to support the new fields:
  - Updated `AddTemplateForm` component with new input fields and state management
  - Updated `EditTemplate` component to display, edit, and save the new fields
  - Enhanced `TemplateList` component to include new fields in search functionality
- Updated context files to reflect schema changes

### 4. Enhanced Templates with Document Connections (3/20/2025)

- Added `prompt` field to templates table
- Created template_documents junction table
- Updated frontend components for document selection
- Enhanced form validation and user feedback

### 5. Fixed Document Upload Functionality (3/18/2025)

- Enhanced storage service with comprehensive error handling
- Implemented automatic bucket creation and validation
- Added proper error detection for bucket operations
- Improved file upload options with caching and upsert capabilities

### 6. Fixed Template Document Connections (3/21/2025)

- Fixed "Unknown error" when updating templates with document connections
- Enhanced error handling in Supabase service for template document operations
- Improved error messages to provide clear feedback about missing tables
- Added table existence checks before performing operations
- Created migration script for template_documents table
- Implemented graceful fallback to preserve template updates even when document connections fail

### 7. Backend Refactoring (3/19/2025)

- Created modular structure with separate modules
- Enhanced error handling and response consistency
- Added proper documentation for each endpoint
- Improved logging throughout the application

## Testing Status

✅ Chat page using real OpenAI integration  
✅ Chat page file uploads working  
✅ Documents page file uploads working  
✅ Proper error handling and feedback  
✅ Bucket creation and management  
✅ Backend server starts successfully  
✅ API endpoints accessible  
✅ Template document connections working  
✅ Frontend unit tests passing  
❌ Documents page blank screen issue (in progress)

## Important Note on Mock Data

Per project requirements, we will avoid using mock data whenever possible. Real services and APIs should be used for all features. If mock data is absolutely necessary for any reason (e.g., testing without API access), this must be explicitly approved before implementation.

## Project-Specific Commands

- **Test Environment Variables**: Navigate to `/env-test` page
- **Check Document Upload**: Monitor browser console during upload
- **Test Supabase Connection**: Try direct API calls if components fail
- **Debug Options**: Add `?debug=true` to URLs to enable enhanced console logging

## Application Running Instructions

Always remember the correct workflow to run the application:

1. Start the frontend in one terminal:

   ```bash
   conda activate lexpert_case_ai
   cd src/frontend
   npm run dev
   ```

2. Start the backend in a separate terminal:
   ```bash
   conda activate lexpert_case_ai
   cd backend
   uvicorn main:app --reload
   ```

**Important**: The conda environment must be activated before running any commands. If you encounter issues with missing dependencies, ensure the environment is correctly activated.
