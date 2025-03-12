import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth functions
export const auth = {
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },
  
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }
};

// Bot functions
export const bots = {
  getBots: async () => {
    return await supabase
      .from('bots')
      .select('*')
      .order('updated_at', { ascending: false });
  },
  
  getBot: async (id: string) => {
    return await supabase
      .from('bots')
      .select('*')
      .eq('id', id)
      .single();
  },
  
  createBot: async (botData: any) => {
    return await supabase
      .from('bots')
      .insert(botData)
      .select()
      .single();
  },
  
  updateBot: async (id: string, botData: any) => {
    return await supabase
      .from('bots')
      .update(botData)
      .eq('id', id)
      .select()
      .single();
  },
  
  deleteBot: async (id: string) => {
    return await supabase
      .from('bots')
      .delete()
      .eq('id', id);
  }
};

// Template functions
export const templates = {
  getTemplates: async () => {
    return await supabase
      .from('templates')
      .select('*')
      .order('name');
  },
  
  getTemplate: async (id: string) => {
    return await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
  }
};

// Chat functions
export const chats = {
  getMessages: async (botId: string) => {
    return await supabase
      .from('messages')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at');
  },
  
  sendMessage: async (message: any) => {
    return await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
  }
};

// File storage functions
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    return await supabase.storage
      .from(bucket)
      .upload(path, file);
  },
  
  getFileUrl: (bucket: string, path: string) => {
    return supabase.storage
      .from(bucket)
      .getPublicUrl(path);
  },
  
  deleteFile: async (bucket: string, path: string) => {
    return await supabase.storage
      .from(bucket)
      .remove([path]);
  }
}; 