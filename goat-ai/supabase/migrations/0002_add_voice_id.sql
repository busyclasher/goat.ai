-- Add voice_id column to personas table for ElevenLabs voice mapping
-- This allows each persona to have a custom voice for TTS

ALTER TABLE personas 
ADD COLUMN voice_id VARCHAR(100);

-- Add index for better performance when querying by voice_id
CREATE INDEX idx_personas_voice_id ON personas(voice_id);

-- Update existing personas with default voice if needed
-- You can update specific personas with their voice IDs after this migration
COMMENT ON COLUMN personas.voice_id IS 'ElevenLabs voice ID for text-to-speech. If null, uses default voice.';

