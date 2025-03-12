import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Templates from './pages/Templates';
import EditTemplate from './pages/EditTemplate';
import Wizard from './pages/Wizard';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Documents from './pages/Documents';
import EnvTest from './pages/EnvTest';
import AuthLayout from './components/layouts/AuthLayout';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  // Check for dark mode preference on initial load
  useEffect(() => {
    const darkModePreference = localStorage.getItem('darkMode') === 'true';
    if (darkModePreference) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/env-test" element={<EnvTest />} />
        <Route element={<AuthLayout />}>
          <Route path="/chat/:botId" element={<Chat />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/edit/:id" element={<EditTemplate />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/wizard/:templateId" element={<Wizard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
};

export default App; 