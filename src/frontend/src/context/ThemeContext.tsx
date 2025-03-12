import React, { createContext, useContext, useState, useEffect, FC, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Check localStorage first, then system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Add smooth transition class to body
    document.body.classList.add('transition-colors', 'duration-200');
    
    // Toggle dark class on document element
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    // Save preference
    localStorage.setItem('darkMode', isDarkMode.toString());
    
    // Cleanup
    return () => {
      document.body.classList.remove('transition-colors', 'duration-200');
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}; 