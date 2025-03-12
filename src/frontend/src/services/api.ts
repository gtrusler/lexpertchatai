import axios from 'axios';
import { supabase } from './supabase';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  
  if (data.session) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  
  return config;
});

// RAG API functions
export const rag = {
  query: async (botId: string, prompt: string, options = {}) => {
    try {
      const response = await api.post('/rag', {
        bot_id: botId,
        prompt,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Error querying RAG:', error);
      throw error;
    }
  },
  
  processDocument: async (botId: string, file: File, metadata: any) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bot_id', botId);
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  },
  
  autoTag: async (content: string) => {
    try {
      const response = await api.post('/auto-tag', { content });
      return response.data;
    } catch (error) {
      console.error('Error auto-tagging:', error);
      throw error;
    }
  },
  
  getPromptCoach: async (prompt: string) => {
    try {
      const response = await api.post('/prompt-coach', { prompt });
      return response.data;
    } catch (error) {
      console.error('Error getting prompt coach:', error);
      return { tooltip: null };
    }
  }
};

// Bot API functions
export const botApi = {
  createBot: async (botData: any) => {
    try {
      const response = await api.post('/bots', botData);
      return response.data;
    } catch (error) {
      console.error('Error creating bot:', error);
      throw error;
    }
  },
  
  updateBot: async (botId: string, botData: any) => {
    try {
      const response = await api.put(`/bots/${botId}`, botData);
      return response.data;
    } catch (error) {
      console.error('Error updating bot:', error);
      throw error;
    }
  },
  
  deleteBot: async (botId: string) => {
    try {
      const response = await api.delete(`/bots/${botId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bot:', error);
      throw error;
    }
  }
};

// Template API functions
export const templateApi = {
  getTemplates: async () => {
    try {
      const response = await api.get('/templates');
      return response.data;
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  },
  
  getTemplate: async (templateId: string) => {
    try {
      const response = await api.get(`/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }
};

export default api; 