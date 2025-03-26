import { createClient } from '@supabase/supabase-js';

// Debug flag
const DEBUG = true;
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[TagService]', ...args);
  }
};

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

// Create Supabase client
let supabase: any;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  debugLog('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a dummy client to prevent crashes
  supabase = {
    from: () => ({
      select: () => ({
        order: () => ({ data: null, error: { message: 'Supabase client initialization failed' } })
      })
    })
  };
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  parent_tag_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TagLink {
  entity_id: string;
  tag_hierarchy_id: string;
  created_at?: string;
}

// Get all tags
export const getAllTags = async (): Promise<Tag[]> => {
  try {
    debugLog('Fetching all tags');
    const { data, error } = await supabase
      .from('tag_hierarchy')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    debugLog(`Fetched ${data?.length || 0} tags`);
    return data || [];
  } catch (err: any) {
    console.error('Error fetching tags:', err);
    throw new Error(`Failed to fetch tags: ${err.message}`);
  }
};

// Get tags for a specific document
export const getDocumentTags = async (documentId: string): Promise<Tag[]> => {
  try {
    debugLog(`Fetching tags for document: ${documentId}`);
    const { data, error } = await supabase
      .from('document_tag_links')
      .select(`
        tag_hierarchy_id,
        tag_hierarchy:tag_hierarchy_id (*)
      `)
      .eq('document_id', documentId);

    if (error) {
      throw error;
    }

    // Extract the tag objects from the joined query
    const tags = data?.map((item: { tag_hierarchy: Tag }) => item.tag_hierarchy) || [];
    debugLog(`Fetched ${tags.length} tags for document ${documentId}`);
    return tags;
  } catch (err: any) {
    console.error(`Error fetching tags for document ${documentId}:`, err);
    throw new Error(`Failed to fetch document tags: ${err.message}`);
  }
};

// Get tags for a specific template
export const getTemplateTags = async (templateId: string): Promise<Tag[]> => {
  try {
    debugLog(`Fetching tags for template: ${templateId}`);
    const { data, error } = await supabase
      .from('template_tag_links')
      .select(`
        tag_hierarchy_id,
        tag_hierarchy:tag_hierarchy_id (*)
      `)
      .eq('template_id', templateId);

    if (error) {
      throw error;
    }

    // Extract the tag objects from the joined query
    const tags = data?.map((item: { tag_hierarchy: Tag }) => item.tag_hierarchy) || [];
    debugLog(`Fetched ${tags.length} tags for template ${templateId}`);
    return tags;
  } catch (err: any) {
    console.error(`Error fetching tags for template ${templateId}:`, err);
    throw new Error(`Failed to fetch template tags: ${err.message}`);
  }
};

// Add tag to a document
export const addTagToDocument = async (documentId: string, tagId: string): Promise<void> => {
  try {
    debugLog(`Adding tag ${tagId} to document ${documentId}`);
    const { error } = await supabase
      .from('document_tag_links')
      .insert({
        document_id: documentId,
        tag_hierarchy_id: tagId
      });

    if (error) {
      throw error;
    }

    debugLog(`Successfully added tag ${tagId} to document ${documentId}`);
  } catch (err: any) {
    console.error(`Error adding tag to document:`, err);
    throw new Error(`Failed to add tag to document: ${err.message}`);
  }
};

// Remove tag from a document
export const removeTagFromDocument = async (documentId: string, tagId: string): Promise<void> => {
  try {
    debugLog(`Removing tag ${tagId} from document ${documentId}`);
    const { error } = await supabase
      .from('document_tag_links')
      .delete()
      .eq('document_id', documentId)
      .eq('tag_hierarchy_id', tagId);

    if (error) {
      throw error;
    }

    debugLog(`Successfully removed tag ${tagId} from document ${documentId}`);
  } catch (err: any) {
    console.error(`Error removing tag from document:`, err);
    throw new Error(`Failed to remove tag from document: ${err.message}`);
  }
};

// Add tag to a template
export const addTagToTemplate = async (templateId: string, tagId: string): Promise<void> => {
  try {
    debugLog(`Adding tag ${tagId} to template ${templateId}`);
    const { error } = await supabase
      .from('template_tag_links')
      .insert({
        template_id: templateId,
        tag_hierarchy_id: tagId
      });

    if (error) {
      throw error;
    }

    debugLog(`Successfully added tag ${tagId} to template ${templateId}`);
  } catch (err: any) {
    console.error(`Error adding tag to template:`, err);
    throw new Error(`Failed to add tag to template: ${err.message}`);
  }
};

// Remove tag from a template
export const removeTagFromTemplate = async (templateId: string, tagId: string): Promise<void> => {
  try {
    debugLog(`Removing tag ${tagId} from template ${templateId}`);
    const { error } = await supabase
      .from('template_tag_links')
      .delete()
      .eq('template_id', templateId)
      .eq('tag_hierarchy_id', tagId);

    if (error) {
      throw error;
    }

    debugLog(`Successfully removed tag ${tagId} from template ${templateId}`);
  } catch (err: any) {
    console.error(`Error removing tag from template:`, err);
    throw new Error(`Failed to remove tag from template: ${err.message}`);
  }
};

// Create a new tag
export const createTag = async (tag: Partial<Tag>): Promise<Tag> => {
  try {
    debugLog(`Creating new tag: ${tag.name}`);
    
    // First check if the tag already exists
    const { data: existingTag, error: fetchError } = await supabase
      .from('tag_hierarchy')
      .select('*')
      .eq('name', tag.name)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw fetchError;
    }

    if (existingTag) {
      debugLog(`Tag ${tag.name} already exists, returning existing tag`);
      return existingTag;
    }

    // If tag doesn't exist, create it
    const { data, error } = await supabase
      .from('tag_hierarchy')
      .insert({
        name: tag.name,
        description: tag.description || null,
        parent_tag_id: tag.parent_tag_id || null
      })
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after creating tag');
    }

    debugLog(`Successfully created tag: ${data[0].id}`);
    return data[0];
  } catch (err: any) {
    console.error(`Error creating tag:`, err);
    throw new Error(`Failed to create tag: ${err.message}`);
  }
};

// Update a tag
export const updateTag = async (tagId: string, updates: Partial<Tag>): Promise<Tag> => {
  try {
    debugLog(`Updating tag ${tagId}`);
    const { data, error } = await supabase
      .from('tag_hierarchy')
      .update({
        name: updates.name,
        description: updates.description,
        parent_tag_id: updates.parent_tag_id
      })
      .eq('id', tagId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after updating tag');
    }

    debugLog(`Successfully updated tag: ${tagId}`);
    return data[0];
  } catch (err: any) {
    console.error(`Error updating tag:`, err);
    throw new Error(`Failed to update tag: ${err.message}`);
  }
};

// Delete a tag
export const deleteTag = async (tagId: string): Promise<void> => {
  try {
    debugLog(`Deleting tag ${tagId}`);
    const { error } = await supabase
      .from('tag_hierarchy')
      .delete()
      .eq('id', tagId);

    if (error) {
      throw error;
    }

    debugLog(`Successfully deleted tag: ${tagId}`);
  } catch (err: any) {
    console.error(`Error deleting tag:`, err);
    throw new Error(`Failed to delete tag: ${err.message}`);
  }
};

// Get documents by tag
export const getDocumentsByTag = async (tagId: string): Promise<string[]> => {
  try {
    debugLog(`Fetching documents with tag: ${tagId}`);
    const { data, error } = await supabase
      .from('document_tag_links')
      .select('document_id')
      .eq('tag_hierarchy_id', tagId);

    if (error) {
      throw error;
    }

    const documentIds = data?.map((item: { document_id: string }) => item.document_id) || [];
    debugLog(`Found ${documentIds.length} documents with tag ${tagId}`);
    return documentIds;
  } catch (err: any) {
    console.error(`Error fetching documents by tag:`, err);
    throw new Error(`Failed to fetch documents by tag: ${err.message}`);
  }
};

// Get templates by tag
export const getTemplatesByTag = async (tagId: string): Promise<string[]> => {
  try {
    debugLog(`Fetching templates with tag: ${tagId}`);
    const { data, error } = await supabase
      .from('template_tag_links')
      .select('template_id')
      .eq('tag_hierarchy_id', tagId);

    if (error) {
      throw error;
    }

    const templateIds = data?.map((item: { template_id: string }) => item.template_id) || [];
    debugLog(`Found ${templateIds.length} templates with tag ${tagId}`);
    return templateIds;
  } catch (err: any) {
    console.error(`Error fetching templates by tag:`, err);
    throw new Error(`Failed to fetch templates by tag: ${err.message}`);
  }
};

// Get complete document objects for a specific tag
export const getDocumentsWithTag = async (tagId: string): Promise<any[]> => {
  try {
    debugLog(`Fetching documents with tag: ${tagId}`);
    
    // First get document IDs for the tag
    const documentIds = await getDocumentsByTag(tagId);
    
    if (documentIds.length === 0) {
      debugLog(`No documents found with tag ${tagId}`);
      return [];
    }
    
    // Then fetch the actual document objects
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds);
      
    if (error) {
      throw error;
    }
    
    debugLog(`Fetched ${data?.length || 0} documents with tag ${tagId}`);
    return data || [];
  } catch (err: any) {
    console.error(`Error fetching documents with tag ${tagId}:`, err);
    throw new Error(`Failed to fetch documents with tag: ${err.message}`);
  }
};

export default {
  getAllTags,
  getDocumentTags,
  getTemplateTags,
  addTagToDocument,
  removeTagFromDocument,
  addTagToTemplate,
  removeTagFromTemplate,
  createTag,
  updateTag,
  deleteTag,
  getDocumentsByTag,
  getDocumentsWithTag,
  getTemplatesByTag
};
