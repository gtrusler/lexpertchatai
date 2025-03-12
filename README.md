# Lexpert Case AI

A Retrieval-Augmented Generation (RAG) chatbot for family law and trademark attorneys to draft legal documents, cite laws, and handle case-specific uploads.

## Project Structure

The project is organized as follows:

```
lexpertcaseai/
├── backend/                  # FastAPI backend
│   ├── main.py               # Main FastAPI application
│   └── requirements.txt      # Python dependencies
├── src/
│   ├── frontend/             # React frontend (THIS IS THE MAIN FRONTEND)
│   │   ├── src/              # Frontend source code
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Page components
│   │   │   ├── services/     # API services
│   │   │   ├── App.tsx       # Main App component
│   │   │   ├── main.tsx      # Entry point
│   │   │   └── index.css     # Global styles with Tailwind
│   │   ├── index.html        # HTML template
│   │   ├── package.json      # Frontend dependencies
│   │   ├── tailwind.config.cjs # Tailwind configuration
│   │   ├── postcss.config.cjs  # PostCSS configuration
│   │   └── vite.config.ts    # Vite configuration
│   ├── app.py                # Python application (possibly Streamlit)
│   ├── backend/              # Backend modules
│   ├── core/                 # Core functionality
│   ├── db/                   # Database related code
│   └── ui/                   # UI related code
├── requirements.txt          # Python dependencies for the main project
├── setup.py                  # Python package setup
└── package.json              # Root package.json (not for frontend)
```

## Important Notes

1. **Frontend Location**: The main frontend is located in `src/frontend/`, not in the root directory. Always run frontend commands from this directory.

2. **Backend Location**: The FastAPI backend is in the `backend/` directory at the root.

3. **Conda Environment**: Always activate the conda environment (`conda activate lexpert_case_ai`) in each new terminal window before running any commands. This is essential for both frontend and backend operations.

4. **Running the Application**:

   - Frontend: `cd src/frontend && npm run dev`
   - Backend: `cd backend && uvicorn main:app --reload`

5. **Key Features**:
   - Navigation between dashboard and chat
   - Day/night toggle with localStorage persistence
   - Responsive design with Tailwind CSS
   - Accessibility features (ARIA labels, keyboard shortcuts)

## Setup and Running Instructions

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Python 3.9+ (for backend)
- Conda environment (optional but recommended)

### Frontend Setup

```bash
# Activate conda environment first
conda activate lexpert_case_ai

# Navigate to the frontend directory
cd src/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:5173

### Backend Setup

```bash
# Activate conda environment first (in a new terminal window)
conda activate lexpert_case_ai

# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload
```

The backend API will be available at http://localhost:8000

## Key Components

### Chat Interface

The Chat component (`src/frontend/src/components/Chat.tsx`) includes:

- Navigation back to dashboard
- Day/night toggle
- Voice input toggle
- Message history with loading indicators
- Citation display for legal references

### Dashboard

The Dashboard component (`src/frontend/src/components/Dashboard.tsx`) includes:

- List of case bots
- Recent templates
- Navigation to individual chats
- Responsive grid layout

### Theme Context

The ThemeContext (`src/frontend/src/context/ThemeContext.tsx`) manages:

- Dark/light mode state
- localStorage persistence
- Document class toggling for Tailwind dark mode

## Troubleshooting

If you encounter issues:

1. **Blank page**: Check browser console for errors. Ensure you're running from the correct directory (`src/frontend`).

2. **Missing styles**: Make sure Tailwind is properly configured. Check that `postcss.config.cjs` and `tailwind.config.cjs` exist in the frontend directory.

3. **Backend connection issues**: Verify the backend is running and the Vite proxy is correctly configured in `vite.config.ts`.

4. **"Not found" errors**: Check that routes in `App.tsx` match the URLs you're trying to access.

5. **Command not found errors**: Ensure you've activated the conda environment (`conda activate lexpert_case_ai`) in your current terminal window.

## Development Guidelines

1. **Adding new components**: Place them in `src/frontend/src/components/`.

2. **API integration**: Use the services in `src/frontend/src/services/` for API calls.

3. **Styling**: Use Tailwind CSS classes directly in components. The primary blue color is `#0078D4`.

4. **Dark mode**: Use Tailwind's dark variant (`dark:bg-gray-800`) for dark mode styles.

## License

[MIT](LICENSE)
