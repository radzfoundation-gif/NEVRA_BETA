import { supabase } from './supabase';

export interface UserSkill {
  id: string;
  user_id: string;
  name: string;
  description: string;
  system_prompt: string;
  enabled: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SKILLS: Omit<UserSkill, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'skill-creator',
    description: 'Buat skill baru, modifikasi skill yang ada, dan ukur performa skill. Gunakan saat kamu ingin membuat skill dari awal atau mengoptimalkan skill yang sudah ada.',
    system_prompt: 'You are a skill creation assistant. Help users create, modify, and optimize AI skills. Guide them through defining the skill purpose, writing clear instructions, and testing the skill with sample prompts.',
    enabled: true,
    is_custom: false,
  },
];

// Seed default skills for new users
export async function seedDefaultSkills(userId: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('user_skills')
      .select('id')
      .eq('user_id', userId)
      .eq('is_custom', false)
      .limit(1);

    if (existing && existing.length > 0) return; // already seeded

    await supabase.from('user_skills').insert(
      DEFAULT_SKILLS.map(s => ({ ...s, user_id: userId }))
    );
  } catch {}
}

export async function getSkills(userId: string): Promise<UserSkill[]> {
  await seedDefaultSkills(userId);
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createSkill(
  userId: string,
  skill: { name: string; description: string; systemPrompt: string }
): Promise<UserSkill> {
  const { data, error } = await supabase
    .from('user_skills')
    .insert({
      user_id: userId,
      name: skill.name,
      description: skill.description,
      system_prompt: skill.systemPrompt,
      enabled: true,
      is_custom: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSkill(
  userId: string,
  skillId: string,
  updates: Partial<{ name: string; description: string; system_prompt: string; enabled: boolean }>
): Promise<UserSkill> {
  const { data, error } = await supabase
    .from('user_skills')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', skillId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSkill(userId: string, skillId: string): Promise<void> {
  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('id', skillId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getActiveSkillPrompts(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('user_skills')
      .select('system_prompt')
      .eq('user_id', userId)
      .eq('enabled', true);
    if (!data || data.length === 0) return '';
    return data.map(s => s.system_prompt).filter(Boolean).join('\n\n');
  } catch {
    return '';
  }
}
