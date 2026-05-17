import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Link as LinkIcon, FileArchive, CheckCircle2, AlertCircle, Loader2, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../Sidebar';
import { useUser } from '@/lib/authContext';
import { createSkill } from '@/lib/skillsApi';
import {
  importSkillFromUrl,
  parseSkillFromZip,
  parseSkillMarkdown,
  type ParsedSkill,
} from '@/lib/skillImporter';

type Status = 'idle' | 'parsing' | 'ready' | 'saving' | 'saved' | 'error';

const ImportSkillsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<ParsedSkill[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStatus('idle');
    setError(null);
    setSkills([]);
    setSavedCount(0);
  };

  const handleFile = useCallback(async (file: File) => {
    reset();
    setStatus('parsing');
    try {
      const lower = file.name.toLowerCase();
      let parsed: ParsedSkill[] = [];
      if (lower.endsWith('.zip')) {
        parsed = await parseSkillFromZip(file);
      } else if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
        const text = await file.text();
        const fallbackName = file.name.replace(/\.(md|markdown)$/i, '');
        parsed = [parseSkillMarkdown(text, fallbackName)];
      } else {
        throw new Error('Unsupported file. Use .zip, .md, or .markdown.');
      }
      if (parsed.length === 0) throw new Error('No skill found inside the file.');
      setSkills(parsed);
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || 'Failed to parse file.');
      setStatus('error');
    }
  }, []);

  const handleUrl = useCallback(async () => {
    reset();
    if (!url.trim()) {
      setError('Paste a URL first.');
      setStatus('error');
      return;
    }
    setStatus('parsing');
    try {
      const parsed = await importSkillFromUrl(url);
      if (parsed.length === 0) throw new Error('No skill found at the URL.');
      setSkills(parsed);
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || 'Failed to import from URL.');
      setStatus('error');
    }
  }, [url]);

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      setError('Please sign in to save skills.');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setError(null);
    let saved = 0;
    try {
      for (const s of skills) {
        await createSkill(user.id, {
          name: s.name,
          description: s.description || 'Imported skill',
          systemPrompt: s.systemPrompt,
        });
        saved += 1;
        setSavedCount(saved);
      }
      setStatus('saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save skills.');
      setStatus('error');
    }
  }, [skills, user?.id]);

  const updateSkill = (idx: number, patch: Partial<ParsedSkill>) => {
    setSkills((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSkill = (idx: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9] overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full p-4 md:p-8">
          <button
            onClick={() => navigate('/skills')}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6"
          >
            <ArrowLeft size={16} /> Back to Skills
          </button>

          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Import Skills</h1>
          <p className="text-zinc-500 mb-6">
            Bring in a skill from a ZIP archive, a single SKILL.md file, or a URL (GitHub repo, raw .md, or .zip).
          </p>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl w-fit mb-6">
            <button
              onClick={() => setTab('file')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                tab === 'file' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><Upload size={14} /> File</span>
            </button>
            <button
              onClick={() => setTab('url')}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                tab === 'url' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><LinkIcon size={14} /> URL</span>
            </button>
          </div>

          {tab === 'file' ? (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`block cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <input
                type="file"
                accept=".zip,.md,.markdown"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <FileArchive className="mx-auto mb-3 text-zinc-400" size={32} />
              <div className="text-sm font-medium text-zinc-900">Drop a .zip or SKILL.md, or click to choose</div>
              <div className="text-xs text-zinc-500 mt-1">ZIP must contain at least one SKILL.md</div>
            </label>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <label className="text-sm font-medium text-zinc-900">Skill URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repo  or  https://example.com/skill.md  or  https://example.com/skill.zip"
                className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
              <button
                onClick={handleUrl}
                disabled={status === 'parsing'}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-60"
              >
                {status === 'parsing' ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                Fetch & Preview
              </button>
              <p className="mt-3 text-xs text-zinc-500">
                GitHub URLs are auto-resolved to <code>SKILL.md</code> on the default branch. Some sites may block CORS — in that case, download the file and use the File tab.
              </p>
            </div>
          )}

          <AnimatePresence>
            {status === 'parsing' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500"
              >
                <Loader2 size={14} className="animate-spin" /> Parsing skill...
              </motion.div>
            )}

            {status === 'error' && error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {status === 'saved' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>
                  Imported {savedCount} skill{savedCount === 1 ? '' : 's'}.{' '}
                  <button onClick={() => navigate('/skills')} className="underline font-medium">
                    Open My Skills
                  </button>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {skills.length > 0 && status !== 'saved' && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Preview ({skills.length} skill{skills.length === 1 ? '' : 's'})
                </h2>
                <button
                  onClick={handleSave}
                  disabled={status === 'saving'}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {status === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {status === 'saving' ? `Saving ${savedCount}/${skills.length}...` : `Add ${skills.length} to My Skills`}
                </button>
              </div>

              <div className="space-y-3">
                {skills.map((s, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="inline-flex items-center gap-2 text-zinc-500 text-xs">
                        <FileText size={14} /> SKILL.md
                      </div>
                      <button
                        onClick={() => removeSkill(i)}
                        className="text-zinc-400 hover:text-red-600"
                        title="Remove from import"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <label className="text-xs text-zinc-500">Name</label>
                    <input
                      value={s.name}
                      onChange={(e) => updateSkill(i, { name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <label className="text-xs text-zinc-500 mt-3 block">Description</label>
                    <textarea
                      value={s.description}
                      onChange={(e) => updateSkill(i, { description: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                    />
                    <label className="text-xs text-zinc-500 mt-3 block">System Prompt</label>
                    <textarea
                      value={s.systemPrompt}
                      onChange={(e) => updateSkill(i, { systemPrompt: e.target.value })}
                      rows={8}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono outline-none focus:border-blue-400 resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportSkillsPage;
