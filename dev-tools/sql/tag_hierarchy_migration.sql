-- Create tag_hierarchy table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tag_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_tag_id UUID REFERENCES public.tag_hierarchy(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for tag_hierarchy table
CREATE INDEX IF NOT EXISTS idx_tag_hierarchy_name ON public.tag_hierarchy (name);

-- Create template_tag_links junction table
CREATE TABLE IF NOT EXISTS public.template_tag_links (
  template_id UUID,
  tag_hierarchy_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (template_id, tag_hierarchy_id),
  CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag_template FOREIGN KEY (tag_hierarchy_id) REFERENCES public.tag_hierarchy(id) ON DELETE CASCADE
);

-- Create indexes for template_tag_links table
CREATE INDEX IF NOT EXISTS idx_template_tag_links_template_id ON public.template_tag_links (template_id);
CREATE INDEX IF NOT EXISTS idx_template_tag_links_tag_id ON public.template_tag_links (tag_hierarchy_id);

-- Add RLS policies for tag_hierarchy table
ALTER TABLE public.tag_hierarchy ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select tags
CREATE POLICY "Authenticated users can select tags" ON public.tag_hierarchy
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert tags
CREATE POLICY "Authenticated users can insert tags" ON public.tag_hierarchy
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update their own tags
CREATE POLICY "Authenticated users can update tags" ON public.tag_hierarchy
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add RLS policies for template_tag_links table
ALTER TABLE public.template_tag_links ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select template_tag_links
CREATE POLICY "Authenticated users can select template_tag_links" ON public.template_tag_links
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert template_tag_links
CREATE POLICY "Authenticated users can insert template_tag_links" ON public.template_tag_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete template_tag_links
CREATE POLICY "Authenticated users can delete template_tag_links" ON public.template_tag_links
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger function for tag_hierarchy table if it doesn't exist
-- First check if the function already exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tag_hierarchy table
DROP TRIGGER IF EXISTS set_updated_at ON public.tag_hierarchy;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.tag_hierarchy
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
