import { getApiUrl } from './utils';

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

const apiBase = () => getApiUrl();

async function api<T>(path: string, init: RequestInit & { userId?: string } = {}): Promise<T> {
  const { userId, ...rest } = init;
  const headers = new Headers(rest.headers || {});
  if (!headers.has('Content-Type') && rest.body) headers.set('Content-Type', 'application/json');
  if (userId) headers.set('x-user-id', userId);
  const res = await fetch(`${apiBase()}${path}`, { ...rest, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

function normalize(raw: any): UserSkill {
  return {
    id: raw.id,
    user_id: raw.user_id,
    name: raw.name || '',
    description: raw.description || '',
    system_prompt: raw.system_prompt ?? raw.instructions ?? '',
    enabled: Boolean(raw.enabled),
    is_custom: Boolean(raw.is_custom),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
  };
}

export async function getSkills(userId: string): Promise<UserSkill[]> {
  if (!userId) return [];
  const data = await api<{ skills: any[] }>(`/api/turso/skills?userId=${encodeURIComponent(userId)}`, { userId });
  return (data.skills || []).map(normalize);
}

export async function createSkill(
  userId: string,
  skill: { name: string; description: string; systemPrompt: string }
): Promise<UserSkill> {
  const data = await api<any>('/api/turso/skills', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      name: skill.name,
      description: skill.description,
      systemPrompt: skill.systemPrompt,
    }),
    userId,
  });
  return normalize(data);
}

export async function updateSkill(
  userId: string,
  skillId: string,
  updates: Partial<{ name: string; description: string; system_prompt: string; enabled: boolean }>
): Promise<UserSkill> {
  const body: Record<string, unknown> = { userId };
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.system_prompt !== undefined) body.systemPrompt = updates.system_prompt;
  if (updates.enabled !== undefined) body.enabled = updates.enabled;
  const data = await api<any>(`/api/turso/skills/${encodeURIComponent(skillId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    userId,
  });
  return normalize(data);
}

export async function deleteSkill(userId: string, skillId: string): Promise<void> {
  await api<{ ok: boolean }>(`/api/turso/skills/${encodeURIComponent(skillId)}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    userId,
  });
}

export async function getActiveSkillPrompts(userId: string): Promise<string> {
  try {
    const skills = await getSkills(userId);
    return skills
      .filter((s) => s.enabled)
      .map((s) => s.system_prompt)
      .filter(Boolean)
      .join('\n\n');
  } catch {
    return '';
  }
}
