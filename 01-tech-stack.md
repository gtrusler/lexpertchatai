# Tech Stack Overview

## Database Schema (Supabase)

### Documents Table

```sql
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  chat_id UUID REFERENCES public.chats(id)
);

-- metadata structure:
{
  "name": string,       // Original file name
  "type": string,       // File MIME type
  "size": number,       // File size in bytes
  "storage_path": string // Path in Supabase storage
}
```

### Tag Hierarchy Table

```sql
CREATE TABLE public.tag_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_tag_id UUID REFERENCES public.tag_hierarchy(id),
  type TEXT CHECK (type IN ('system', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Document Tag Links Table

```sql
CREATE TABLE public.document_tag_links (
  document_id UUID REFERENCES public.documents(id),
  tag_hierarchy_id UUID REFERENCES public.tag_hierarchy(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (document_id, tag_hierarchy_id)
);
```

### Storage Configuration

- Bucket: `documents`
- Access: Private (authenticated users only)
- File naming: `{timestamp}_{sanitized_filename}`
- Storage path stored in document metadata

### Document Upload Flow

1. Upload file to Supabase storage
2. Create document record with metadata
3. Show tag selection modal (optional)
4. Create document-tag associations
5. Handle cleanup on failures
6. Real-time updates via Supabase subscriptions

### Tag Management

- Predefined document type tags
- System tags for internal use
- User-selectable tags during upload
- Real-time tag updates
- Efficient tag filtering
