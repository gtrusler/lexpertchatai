-- Basic templates table creation without complex RLS
-- This script only creates the table structure without any policies or triggers
-- Use this if you're encountering issues with the more complex script

CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert a sample template for testing (if it doesn't already exist)
INSERT INTO public.templates (name, description, content)
VALUES (
    'Sample Legal Brief Template',
    'A standard template for legal briefs with proper formatting and structure',
    '# {CASE_TITLE}

## Introduction

{INTRODUCTION_TEXT}

## Facts

{CASE_FACTS}

## Legal Analysis

{LEGAL_ANALYSIS}

## Conclusion

{CONCLUSION_TEXT}'
) ON CONFLICT (name) DO NOTHING;
