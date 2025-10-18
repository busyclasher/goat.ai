-- Enable Realtime for messages table
-- This allows the client to subscribe to INSERT, UPDATE, DELETE events

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Optional: Add realtime for conversations table as well
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

