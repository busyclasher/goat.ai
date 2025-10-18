-- Add suggested_questions column to personas table
ALTER TABLE personas 
ADD COLUMN suggested_questions JSONB NOT NULL DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN personas.suggested_questions IS 'Array of persona-specific suggested questions to display on the landing page';

