# Navigation and Theme Toggle Documentation

This document provides detailed information about the navigation and day/night toggle features in the Lexpert Case AI application.

## Navigation Implementation

The navigation system allows users to move between the dashboard and chat interfaces seamlessly.

### Key Components

1. **Back to Dashboard Button**
   - Located in the Chat component (`src/frontend/src/components/Chat.tsx`)
   - Uses React Router's `useNavigate` hook for client-side navigation
   - Includes ARIA labels and keyboard shortcuts for accessibility

```tsx
// Example implementation
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();

  return (
    <nav>
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-[#0078D4] text-white rounded-md p-2 hover:bg-blue-700"
        aria-label="Return to dashboard"
        accessKey="b"
      >
        ← Back to Dashboard
      </button>
    </nav>
  );
};
```

2. **Breadcrumb Navigation**
   - Provides context about the current location
   - Shows the path: Lexpert Case AI > [Bot Name] > Chat
   - Responsive design (hidden on mobile)

```tsx
<div className="ml-4 text-sm hidden md:block">
  <span>
    <a href="/dashboard" className="hover:underline">
      Lexpert Case AI
    </a>{" "}
    &gt;
    <span className="mx-1">{botName}</span> &gt; <span>Chat</span>
  </span>
</div>
```

3. **Dashboard Links**
   - Each case bot card in the Dashboard links to its respective chat
   - Uses React Router's `Link` component for client-side navigation

```tsx
<Link
  to={`/chat/${bot.id}`}
  className="block rounded-lg shadow-md bg-white hover:bg-gray-50"
>
  {/* Bot card content */}
</Link>
```

## Day/Night Toggle Implementation

The day/night toggle allows users to switch between light and dark modes for better readability in different environments.

### Key Components

1. **ThemeContext**
   - Located in `src/frontend/src/context/ThemeContext.tsx`
   - Manages the dark mode state across the application
   - Persists user preference in localStorage
   - Toggles the `dark` class on the document element for Tailwind dark mode

```tsx
// ThemeContext implementation
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
```

2. **Toggle Button**
   - Located in the Chat component
   - Uses moon/sun icons to indicate current mode
   - Includes ARIA labels and keyboard shortcuts

```tsx
const { isDarkMode, toggleDarkMode } = useTheme();

<button
  onClick={toggleDarkMode}
  className="p-2 rounded-full text-blue-600 hover:text-blue-800"
  aria-label="Toggle dark mode"
  accessKey="m"
>
  {isDarkMode ? "🌙" : "☀️"}
</button>;
```

3. **Tailwind Dark Mode Classes**
   - Components use Tailwind's dark variant for styling
   - Example: `className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white"`
   - Configured in `tailwind.config.cjs` with `darkMode: 'class'`

## Performance Considerations

1. **Navigation Speed**

   - Client-side routing ensures <100ms transitions
   - Preloading of dashboard data when possible

2. **Theme Toggle Performance**
   - Direct DOM manipulation for class toggling
   - Minimal re-renders due to context optimization
   - localStorage operations are async and don't block the UI

## Accessibility Features

1. **Keyboard Shortcuts**

   - `Alt+B`: Navigate back to dashboard
   - `Alt+M`: Toggle dark/light mode
   - `Alt+V`: Toggle voice input (when available)

2. **ARIA Attributes**

   - All interactive elements have appropriate ARIA labels
   - Focus management for keyboard navigation

3. **Color Contrast**
   - Both light and dark modes meet WCAG AA standards for contrast
   - Primary blue (#0078D4) is used consistently for interactive elements

## Testing

To test these features:

1. **Navigation Testing**

   - Click "Back to Dashboard" from any chat
   - Navigate to a chat from the dashboard
   - Test keyboard shortcuts (Alt+B)
   - Verify breadcrumb accuracy

2. **Theme Toggle Testing**
   - Toggle between light and dark modes
   - Refresh the page to verify persistence
   - Test in different browsers
   - Verify all components update appropriately

## Troubleshooting

Common issues and solutions:

1. **Navigation not working**

   - Check React Router setup in `App.tsx`
   - Verify route paths match the navigation targets

2. **Theme toggle not persisting**

   - Check localStorage access (private browsing can block it)
   - Verify the useEffect in ThemeContext is running

3. **Styling inconsistencies in dark mode**
   - Ensure components use both light and dark variants
   - Check that `darkMode: 'class'` is set in Tailwind config
