-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create personas table
CREATE TABLE personas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  style_bullets JSONB NOT NULL DEFAULT '[]',
  taboo JSONB NOT NULL DEFAULT '[]',
  system_prompt TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_personas_slug ON personas(slug);
CREATE INDEX idx_conversations_persona_id ON conversations(persona_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your needs)
CREATE POLICY "Allow public read access to personas" ON personas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to personas" ON personas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to conversations" ON conversations FOR UPDATE USING (true);
CREATE POLICY "Allow public read access to messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to messages" ON messages FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
