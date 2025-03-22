-- Create document_tag_links junction table
CREATE TABLE IF NOT EXISTS public.document_tag_links (
  document_id UUID,
  tag_hierarchy_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, tag_hierarchy_id),
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag_document FOREIGN KEY (tag_hierarchy_id) REFERENCES public.tag_hierarchy(id) ON DELETE CASCADE
);

-- Create indexes for document_tag_links table
CREATE INDEX IF NOT EXISTS idx_document_tag_links_document_id ON public.document_tag_links (document_id);
CREATE INDEX IF NOT EXISTS idx_document_tag_links_tag_id ON public.document_tag_links (tag_hierarchy_id);

-- Add RLS policies for document_tag_links table
ALTER TABLE public.document_tag_links ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select document_tag_links
CREATE POLICY "Authenticated users can select document_tag_links" ON public.document_tag_links
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert document_tag_links
CREATE POLICY "Authenticated users can insert document_tag_links" ON public.document_tag_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete document_tag_links
CREATE POLICY "Authenticated users can delete document_tag_links" ON public.document_tag_links
  FOR DELETE USING (auth.role() = 'authenticated');
