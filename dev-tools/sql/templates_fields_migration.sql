-- Migration script to add new fields to templates table: case_history, participants, and objective
-- Created: 2025-03-21

-- Check if the prompt column already exists in the templates table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'templates' 
        AND column_name = 'prompt'
    ) THEN
        -- Add prompt column to templates table
        ALTER TABLE public.templates ADD COLUMN prompt TEXT;
        RAISE NOTICE 'Added prompt column to templates table';
    ELSE
        RAISE NOTICE 'prompt column already exists in templates table';
    END IF;
END $$;

-- Check if case_history column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'templates' 
        AND column_name = 'case_history'
    ) THEN
        -- Add case_history column to templates table
        ALTER TABLE public.templates ADD COLUMN case_history TEXT;
        RAISE NOTICE 'Added case_history column to templates table';
    ELSE
        RAISE NOTICE 'case_history column already exists in templates table';
    END IF;
END $$;

-- Check if participants column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'templates' 
        AND column_name = 'participants'
    ) THEN
        -- Add participants column to templates table
        ALTER TABLE public.templates ADD COLUMN participants TEXT;
        RAISE NOTICE 'Added participants column to templates table';
    ELSE
        RAISE NOTICE 'participants column already exists in templates table';
    END IF;
END $$;

-- Check if objective column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'templates' 
        AND column_name = 'objective'
    ) THEN
        -- Add objective column to templates table
        ALTER TABLE public.templates ADD COLUMN objective TEXT;
        RAISE NOTICE 'Added objective column to templates table';
    ELSE
        RAISE NOTICE 'objective column already exists in templates table';
    END IF;
END $$;

-- Update the memory-bank/techContext.md file to document these changes
-- This needs to be done manually or through another script
