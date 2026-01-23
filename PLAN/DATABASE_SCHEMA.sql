
-- NEVRA DATABASE CORE SCHEMA

CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY,
  plan TEXT DEFAULT 'free',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  model TEXT,
  input_tokens INT,
  output_tokens INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  role TEXT,
  content TEXT,
  model TEXT,
  tokens INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  content TEXT,
  embedding VECTOR(1536)
);
