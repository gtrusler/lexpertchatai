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
  },

  createTemplate: async (templateData: any) => {
    return await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single();
  },
  
  updateTemplate: async (id: string, templateData: any) => {
    return await supabase
      .from('templates')
      .update(templateData)
      .eq('id', id)
      .select()
      .single();
  },
  
  deleteTemplate: async (id: string) => {
    return await supabase
      .from('templates')
      .delete()
      .eq('id', id);
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
    console.log(`[Storage] Uploading file to ${bucket}/${path}`);
    try {
      // Check if bucket exists first
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('[Storage] Error listing buckets:', listError);
      } else {
        const bucketExists = buckets ? buckets.some(b => b.name === bucket) : false;
        if (!bucketExists) {
          console.warn(`[Storage] Bucket '${bucket}' may not exist. Attempting to create...`);
          try {
            const { error } = await supabase.storage.createBucket(bucket, {
              public: true,
              fileSizeLimit: 10485760 // 10MB
            });
            
            if (error) {
              // Check if the error is because the bucket already exists
              if (error.message && error.message.includes('already exists')) {
                console.log(`[Storage] Bucket '${bucket}' already exists, proceeding with upload`);
              } else {
                // Only log the error, still try to upload
                console.error('[Storage] Error creating bucket:', error);
              }
            } else {
              console.log(`[Storage] Bucket '${bucket}' created successfully`);
            }
          } catch (err) {
            console.error('[Storage] Error in bucket creation:', err);
          }
        }
      }
      
      // Proceed with upload
      const result = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true // Overwrite if file exists
        });
      
      if (result.error) {
        console.error(`[Storage] Upload error for ${path}:`, result.error);
      } else {
        console.log(`[Storage] Successfully uploaded ${path}`);
      }
      
      return result;
    } catch (err) {
      console.error('[Storage] Unexpected error during upload:', err);
      throw err;
    }
  },
  
  getFileUrl: (bucket: string, path: string) => {
    console.log(`[Storage] Getting URL for ${bucket}/${path}`);
    const result = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    if (!result.data?.publicUrl) {
      console.warn(`[Storage] No public URL found for ${path}`);
    }
    
    return result;
  },
  
  deleteFile: async (bucket: string, path: string) => {
    console.log(`[Storage] Deleting file ${bucket}/${path}`);
    try {
      const result = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (result.error) {
        console.error(`[Storage] Delete error for ${path}:`, result.error);
      } else {
        console.log(`[Storage] Successfully deleted ${path}`);
      }
      
      return result;
    } catch (err) {
      console.error('[Storage] Unexpected error during delete:', err);
      throw err;
    }
  }
}; 