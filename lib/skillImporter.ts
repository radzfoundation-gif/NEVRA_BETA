import JSZip from 'jszip';

export interface ParsedSkill {
  name: string;
  description: string;
  systemPrompt: string;
  source?: string;
}

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;

export function parseSkillMarkdown(raw: string, fallbackName?: string): ParsedSkill {
  const text = raw.replace(/^﻿/, '').trim();
  const match = text.match(FRONTMATTER_REGEX);

  let frontmatter: Record<string, string> = {};
  let body = text;

  if (match) {
    body = match[2].trim();
    const lines = match[1].split(/\r?\n/);
    let currentKey: string | null = null;
    let buffer: string[] = [];
    const flush = () => {
      if (currentKey) {
        frontmatter[currentKey] = buffer.join(' ').trim().replace(/^["']|["']$/g, '');
      }
      buffer = [];
    };
    for (const line of lines) {
      const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (kv) {
        flush();
        currentKey = kv[1].trim().toLowerCase();
        const value = kv[2].trim();
        if (value === '>' || value === '|') {
          buffer = [];
        } else {
          buffer = [value];
        }
      } else if (line.trim().startsWith('- ') && currentKey) {
        buffer.push(line.trim().slice(2));
      } else if (currentKey && line.trim()) {
        buffer.push(line.trim());
      }
    }
    flush();
  }

  const name = (frontmatter.name || fallbackName || 'imported-skill').trim();
  const description = (frontmatter.description || frontmatter.summary || '').trim();
  const systemPrompt = body || raw;

  return { name, description, systemPrompt };
}

async function readAsText(file: File | Blob): Promise<string> {
  return await file.text();
}

export async function parseSkillFromZip(file: File | Blob): Promise<ParsedSkill[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const skillFiles = Object.values(zip.files).filter((f) => {
    if (f.dir) return false;
    const name = f.name.toLowerCase();
    return name.endsWith('skill.md') || name.endsWith('/skill.md') || name === 'skill.md';
  });

  if (skillFiles.length === 0) {
    const anyMd = Object.values(zip.files).find((f) => !f.dir && f.name.toLowerCase().endsWith('.md'));
    if (!anyMd) throw new Error('No SKILL.md (or *.md) found in the ZIP archive.');
    const content = await anyMd.async('string');
    const fallbackName = anyMd.name.split('/').pop()?.replace(/\.md$/i, '') || 'imported-skill';
    return [parseSkillMarkdown(content, fallbackName)];
  }

  const results: ParsedSkill[] = [];
  for (const f of skillFiles) {
    const content = await f.async('string');
    const folderName = f.name.split('/').slice(-2, -1)[0];
    results.push(parseSkillMarkdown(content, folderName));
  }
  return results;
}

function isLikelyZipUrl(url: string): boolean {
  return /\.zip(\?.*)?$/i.test(url);
}

function isLikelyMarkdownUrl(url: string): boolean {
  return /\.(md|markdown)(\?.*)?$/i.test(url);
}

function githubRepoFromUrl(url: string): { owner: string; repo: string; ref?: string; path?: string } | null {
  try {
    const u = new URL(url);
    if (!/github\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo, kind, ref, ...rest] = parts;
    if (!kind) return { owner, repo: repo.replace(/\.git$/, '') };
    if (kind === 'tree' || kind === 'blob') {
      return { owner, repo, ref, path: rest.join('/') };
    }
    return { owner, repo };
  } catch {
    return null;
  }
}

async function tryFetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function tryFetchBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function importSkillFromUrl(rawUrl: string): Promise<ParsedSkill[]> {
  const url = rawUrl.trim();
  if (!url) throw new Error('URL is required.');

  if (isLikelyZipUrl(url)) {
    const blob = await tryFetchBlob(url);
    if (!blob) throw new Error('Could not download ZIP from URL (network or CORS error).');
    return await parseSkillFromZip(blob);
  }

  if (isLikelyMarkdownUrl(url)) {
    const text = await tryFetchText(url);
    if (!text) throw new Error('Could not fetch markdown from URL.');
    return [parseSkillMarkdown(text)];
  }

  const gh = githubRepoFromUrl(url);
  if (gh) {
    const refs = gh.ref ? [gh.ref] : ['main', 'master'];
    const basePath = gh.path ? gh.path.replace(/\/+$/, '') : '';
    const tries: string[] = [];
    for (const ref of refs) {
      if (basePath) {
        tries.push(`https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/${ref}/${basePath}/SKILL.md`);
        tries.push(`https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/${ref}/${basePath}`);
      } else {
        tries.push(`https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/${ref}/SKILL.md`);
      }
      tries.push(`https://codeload.github.com/${gh.owner}/${gh.repo}/zip/refs/heads/${ref}`);
    }
    for (const candidate of tries) {
      if (candidate.endsWith('.md') || candidate.endsWith('SKILL.md')) {
        const text = await tryFetchText(candidate);
        if (text) return [parseSkillMarkdown(text, gh.repo)];
      } else if (candidate.includes('codeload.github.com')) {
        const blob = await tryFetchBlob(candidate);
        if (blob) {
          try {
            return await parseSkillFromZip(blob);
          } catch {
            // continue
          }
        }
      } else {
        const text = await tryFetchText(candidate);
        if (text && /^---/.test(text.trim())) return [parseSkillMarkdown(text, gh.repo)];
      }
    }
    throw new Error('Could not locate SKILL.md in the GitHub repository.');
  }

  const text = await tryFetchText(url);
  if (text) {
    if (text.trim().startsWith('---')) return [parseSkillMarkdown(text)];
  }
  const blob = await tryFetchBlob(url);
  if (blob && blob.type.includes('zip')) {
    return await parseSkillFromZip(blob);
  }

  throw new Error('Unsupported URL. Provide a direct .md, .zip, or GitHub repository link.');
}
