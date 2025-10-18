-- Add persona_id to messages table to track which persona generated each message
-- This enables persona switching within a conversation while maintaining attribution

ALTER TABLE messages ADD COLUMN persona_id UUID REFERENCES personas(id) ON DELETE SET NULL;

-- Index for performance when filtering/joining by persona
CREATE INDEX idx_messages_persona_id ON messages(persona_id);

-- Add comment for documentation
COMMENT ON COLUMN messages.persona_id IS 'The persona that generated this message (NULL for user messages, persona ID for assistant messages)';

