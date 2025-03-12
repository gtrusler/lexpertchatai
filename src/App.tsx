import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat/:botId" element={<Chat />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App; 