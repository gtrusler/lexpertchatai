-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read templates
CREATE POLICY "Allow anyone to read templates" 
ON public.templates 
FOR SELECT 
USING (true);

-- Create policy to allow only admins to insert templates
CREATE POLICY "Allow admins to insert templates" 
ON public.templates 
FOR INSERT 
TO authenticated
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Create policy to allow only admins to update templates
CREATE POLICY "Allow admins to update templates" 
ON public.templates 
FOR UPDATE 
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Create policy to allow only admins to delete templates
CREATE POLICY "Allow admins to delete templates" 
ON public.templates 
FOR DELETE 
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
