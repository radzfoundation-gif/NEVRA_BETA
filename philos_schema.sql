-- =====================================================
-- NOIR PHILOS - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable pgvector for semantic memory search
create extension if not exists vector;

-- Philos Memory (persistent per-user context)
create table if not exists philos_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null default 'fact', -- fact | preference | project | goal | event
  content text not null,
  embedding vector(1536),
  tags text[],
  importance int default 5, -- 1-10
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Philos User Profile (who Philos knows you as)
create table if not exists philos_profile (
  user_id uuid primary key references auth.users,
  name text,
  occupation text,
  timezone text default 'Asia/Jakarta',
  language text default 'id',
  tone text default 'friendly', -- friendly | professional | casual
  goals text[],
  current_projects text[],
  preferences jsonb default '{}',
  updated_at timestamptz default now()
);

-- Philos Integrations (OAuth tokens)
create table if not exists philos_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  provider text not null, -- gmail | github | slack | google_drive | notion | calendar
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  metadata jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- Philos Conversations (separate from main chat)
create table if not exists philos_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,
  messages jsonb default '[]',
  context_used text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table philos_memory enable row level security;
alter table philos_profile enable row level security;
alter table philos_integrations enable row level security;
alter table philos_conversations enable row level security;

create policy "Users can manage own memory" on philos_memory
  for all using (auth.uid() = user_id);

create policy "Users can manage own profile" on philos_profile
  for all using (auth.uid() = user_id);

create policy "Users can manage own integrations" on philos_integrations
  for all using (auth.uid() = user_id);

create policy "Users can manage own conversations" on philos_conversations
  for all using (auth.uid() = user_id);

-- =====================================================
-- USER SKILLS
-- =====================================================

create table if not exists user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text not null default '',
  system_prompt text not null default '',
  enabled boolean default true,
  is_custom boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_skills enable row level security;

create policy "Users can manage own skills" on user_skills
  for all using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists user_skills_user_id_idx on user_skills(user_id);
