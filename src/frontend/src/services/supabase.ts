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

// Template interfaces
export interface Template {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  content?: string;
  case_history?: string;
  participants?: string;
  objective?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateDocument {
  template_id: string;
  document_id: string;
  created_at: string;
}

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

  createTemplate: async (templateData: Partial<Template>) => {
    return await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single();
  },
  
  updateTemplate: async (id: string, templateData: Partial<Template>) => {
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
  },
  
  // Document connection functions
  getTemplateDocuments: async (templateId: string) => {
    return await supabase
      .from('template_documents')
      .select('document_id')
      .eq('template_id', templateId);
  },
  
  addDocumentToTemplate: async (templateId: string, documentId: string) => {
    return await supabase
      .from('template_documents')
      .insert({ template_id: templateId, document_id: documentId })
      .select();
  },
  
  removeDocumentFromTemplate: async (templateId: string, documentId: string) => {
    return await supabase
      .from('template_documents')
      .delete()
      .eq('template_id', templateId)
      .eq('document_id', documentId);
  },
  
  // Replace all document connections for a template
  updateTemplateDocuments: async (templateId: string, documentIds: string[]) => {
    try {
      console.log(`[TemplateService] Updating document connections for template ${templateId}`);
      
      // First check if the table exists
      const { error: checkError } = await supabase
        .from('template_documents')
        .select('template_id')
        .limit(1);
      
      if (checkError) {
        // If the error is because the table doesn't exist
        if (checkError.code === '42P01') {
          console.error('[TemplateService] template_documents table does not exist:', checkError);
          return { 
            data: null, 
            error: { 
              message: 'The template_documents table does not exist. Please run the migration script.',
              code: 'TABLE_NOT_FOUND'
            } 
          };
        }
        
        // Some other error occurred
        console.error('[TemplateService] Error checking template_documents table:', checkError);
        return { data: null, error: checkError };
      }
      
      // Delete all existing connections
      const { error: deleteError } = await supabase
        .from('template_documents')
        .delete()
        .eq('template_id', templateId);
        
      if (deleteError) {
        console.error('[TemplateService] Error deleting existing document connections:', deleteError);
        return { data: null, error: deleteError };
      }
      
      // If there are no documents to add, return
      if (!documentIds.length) {
        console.log('[TemplateService] No documents to add, returning');
        return { data: null, error: null };
      }
      
      // Then insert new connections
      console.log(`[TemplateService] Inserting ${documentIds.length} document connections`);
      const result = await supabase
        .from('template_documents')
        .insert(
          documentIds.map(docId => ({
            template_id: templateId,
            document_id: docId
          }))
        );
        
      if (result.error) {
        console.error('[TemplateService] Error inserting document connections:', result.error);
      } else {
        console.log('[TemplateService] Document connections updated successfully');
      }
      
      return result;
    } catch (error) {
      console.error('[TemplateService] Unexpected error in updateTemplateDocuments:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error in updateTemplateDocuments',
          details: JSON.stringify(error)
        } 
      };
    }
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

// Document interfaces
export interface Document {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTag {
  document_id: string;
  tag: string;
  created_at: string;
}

export interface BotDocument {
  bot_id: string;
  document_id: string;
  created_at: string;
}

// Document functions
export const documents = {
  // Get all documents
  getDocuments: async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[Documents] Error fetching documents:', error);
      }
      
      return { data, error };
    } catch (err) {
      console.error('[Documents] Unexpected error fetching documents:', err);
      throw err;
    }
  },
  
  // Get a single document by ID
  getDocument: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`[Documents] Error fetching document ${id}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error fetching document ${id}:`, err);
      throw err;
    }
  },
  
  // Document tag functions
  getTags: async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_tags')
        .select('*')
        .eq('document_id', documentId);
      
      if (error) {
        console.error(`[Documents] Error fetching tags for document ${documentId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error fetching tags for document ${documentId}:`, err);
      throw err;
    }
  },
  
  // Add a tag to a document
  addTag: async (documentId: string, tag: string) => {
    try {
      const { data, error } = await supabase
        .from('document_tags')
        .insert({
          document_id: documentId,
          tag
        });
      
      if (error) {
        console.error(`[Documents] Error adding tag ${tag} to document ${documentId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error adding tag ${tag} to document ${documentId}:`, err);
      throw err;
    }
  },
  
  // Remove a tag from a document
  removeTag: async (documentId: string, tag: string) => {
    try {
      const { data, error } = await supabase
        .from('document_tags')
        .delete()
        .eq('document_id', documentId)
        .eq('tag', tag);
      
      if (error) {
        console.error(`[Documents] Error removing tag ${tag} from document ${documentId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error removing tag ${tag} from document ${documentId}:`, err);
      throw err;
    }
  },
  
  // Update all tags for a document
  updateTags: async (documentId: string, tags: string[]) => {
    try {
      // First, delete all existing tags for the document
      const { error: deleteError } = await supabase
        .from('document_tags')
        .delete()
        .eq('document_id', documentId);
      
      if (deleteError) {
        console.error(`[Documents] Error deleting existing tags for document ${documentId}:`, deleteError);
        return { data: null, error: deleteError };
      }
      
      // If there are no new tags, we're done
      if (tags.length === 0) {
        return { data: [], error: null };
      }
      
      // Insert new tags
      const tagsToInsert = tags.map(tag => ({
        document_id: documentId,
        tag
      }));
      
      const { data, error } = await supabase
        .from('document_tags')
        .insert(tagsToInsert)
        .select();
      
      if (error) {
        console.error(`[Documents] Error updating tags for document ${documentId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error updating tags for document ${documentId}:`, err);
      throw err;
    }
  },
  
  // Bot-document association functions
  getBotDocuments: async (botId: string) => {
    try {
      const { data, error } = await supabase
        .from('bot_documents')
        .select('*')
        .eq('bot_id', botId);
      
      if (error) {
        console.error(`[Documents] Error fetching documents for bot ${botId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error fetching documents for bot ${botId}:`, err);
      throw err;
    }
  },
  
  // Add a document to a bot
  addDocumentToBot: async (botId: string, documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('bot_documents')
        .insert({
          bot_id: botId,
          document_id: documentId
        });
      
      if (error) {
        console.error(`[Documents] Error adding document ${documentId} to bot ${botId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error adding document ${documentId} to bot ${botId}:`, err);
      throw err;
    }
  },
  
  // Remove a document from a bot
  removeDocumentFromBot: async (botId: string, documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('bot_documents')
        .delete()
        .eq('bot_id', botId)
        .eq('document_id', documentId);
      
      if (error) {
        console.error(`[Documents] Error removing document ${documentId} from bot ${botId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error removing document ${documentId} from bot ${botId}:`, err);
      throw err;
    }
  },
  
  // Update all documents for a bot
  updateBotDocuments: async (botId: string, documentIds: string[]) => {
    try {
      // First, delete all existing document associations for the bot
      const { error: deleteError } = await supabase
        .from('bot_documents')
        .delete()
        .eq('bot_id', botId);
      
      if (deleteError) {
        console.error(`[Documents] Error deleting existing document associations for bot ${botId}:`, deleteError);
        return { data: null, error: deleteError };
      }
      
      // If there are no new document associations, we're done
      if (documentIds.length === 0) {
        return { data: [], error: null };
      }
      
      // Insert new document associations
      const associationsToInsert = documentIds.map(documentId => ({
        bot_id: botId,
        document_id: documentId
      }));
      
      const { data, error } = await supabase
        .from('bot_documents')
        .insert(associationsToInsert)
        .select();
      
      if (error) {
        console.error(`[Documents] Error updating document associations for bot ${botId}:`, error);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`[Documents] Unexpected error updating document associations for bot ${botId}:`, err);
      throw err;
    }
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
  
  getFileUrl: async (bucket: string, path: string) => {
    console.log(`[Storage] Getting URL for ${bucket}/${path}`);
    try {
      // Use createSignedUrl instead of getPublicUrl for better security
      const result = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (!result.data?.signedUrl) {
        console.warn(`[Storage] No signed URL found for ${path}`);
      }
      
      return result;
    } catch (err) {
      console.error(`[Storage] Error getting URL for ${path}:`, err);
      throw err;
    }
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
  },
  
  // Add a method to list files in a bucket
  listFiles: async (bucket: string, path: string = '') => {
    console.log(`[Storage] Listing files in ${bucket}/${path}`);
    try {
      const result = await supabase.storage
        .from(bucket)
        .list(path);
      
      if (result.error) {
        console.error(`[Storage] Error listing files in ${bucket}/${path}:`, result.error);
      } else {
        console.log(`[Storage] Found ${result.data?.length || 0} files in ${bucket}/${path}`);
      }
      
      return result;
    } catch (err) {
      console.error(`[Storage] Error listing files in ${bucket}/${path}:`, err);
      throw err;
    }
  }
}; 