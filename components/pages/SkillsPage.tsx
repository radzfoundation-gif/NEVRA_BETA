import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, Edit2, X, Check, SquareTerminal, Wrench, Loader2, Github, Download, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/lib/authContext';
import { getSkills, createSkill, updateSkill, deleteSkill, UserSkill } from '@/lib/skillsApi';

const SkillsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [selected, setSelected] = useState<UserSkill | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', systemPrompt: '' });
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<UserSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  // Import state
  const [importUrl, setImportUrl] = useState('');
  const [importSkillName, setImportSkillName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{ name: string; description: string; systemPrompt: string } | null>(null);
  const [browseList, setBrowseList] = useState<string[]>([]);
  const [loadingBrowse, setLoadingBrowse] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getSkills(user.id);
      setSkills(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    } catch {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (skill: UserSkill) => {
    if (!user?.id) return;
    const updated = await updateSkill(user.id, skill.id, { enabled: !skill.enabled });
    setSkills(prev => prev.map(s => s.id === skill.id ? updated : s));
    if (selected?.id === skill.id) setSelected(updated);
  };

  const handleDelete = async (skill: UserSkill) => {
    if (!user?.id || !skill.is_custom) return;
    await deleteSkill(user.id, skill.id);
    const remaining = skills.filter(s => s.id !== skill.id);
    setSkills(remaining);
    setSelected(remaining[0] || null);
  };

  const handleCreate = async () => {
    if (!user?.id || !newSkill.name.trim()) return;
    setCreating(true);
    try {
      const skill = await createSkill(user.id, {
        name: newSkill.name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: newSkill.description,
        systemPrompt: newSkill.systemPrompt,
      });
      setSkills(prev => [...prev, skill]);
      setSelected(skill);
      setNewSkill({ name: '', description: '', systemPrompt: '' });
      setShowCreate(false);
    } catch {}
    setCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!user?.id || !editDraft) return;
    setSaving(true);
    try {
      const updated = await updateSkill(user.id, editDraft.id, {
        name: editDraft.name,
        description: editDraft.description,
        system_prompt: editDraft.system_prompt,
      });
      setSkills(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelected(updated);
      setEditMode(false);
      setEditDraft(null);
    } catch {}
    setSaving(false);
  };

  const startEdit = (skill: UserSkill) => {
    setEditDraft({ ...skill });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditDraft(null);
  };

  // ── GitHub Import ──────────────────────────────────────────

  // Parse input — support both plain URL and full npx command
  // e.g. "npx skills add https://github.com/anthropics/skills --skill pdf"
  const parseImportInput = (raw: string): { url: string; skillName: string } => {
    const trimmed = raw.trim();
    const skillMatch = trimmed.match(/--skill\s+([^\s]+)/);
    const skillName = skillMatch ? skillMatch[1] : '';
    const urlMatch = trimmed.match(/https?:\/\/github\.com\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : trimmed;
    return { url, skillName };
  };

  // Build candidate raw URLs to try in order
  const buildCandidateUrls = (githubUrl: string, skillName: string): string[] => {
    const clean = githubUrl.split('?')[0].split('#')[0].replace(/\/+$/, '');
    const match = clean.match(/github\.com\/([^/]+)\/([^/\s]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const [, owner, repo] = match;
    const base = `https://raw.githubusercontent.com/${owner}/${repo}/main`;
    const name = skillName.trim().toLowerCase().replace(/\s+/g, '-');

    if (!name) {
      // No skill name — try common locations
      return [
        `${base}/SKILL.md`,
        `${base}/skill.md`,
      ];
    }
    // Try all common structures used by anthropics/skills and others
    return [
      `${base}/skills/${name}/SKILL.md`,   // anthropics/skills structure
      `${base}/${name}/SKILL.md`,           // flat structure
      `${base}/${name}/skill.md`,
      `${base}/SKILL.md`,                   // single-skill repo
    ];
  };

  // Parse SKILL.md — supports YAML frontmatter and markdown headings
  const parseSkillMd = (content: string, fallbackName: string): { name: string; description: string; systemPrompt: string } => {
    let name = fallbackName;
    let description = '';
    let body = content;

    // Parse YAML frontmatter (--- ... ---)
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (fmMatch) {
      const fm = fmMatch[1];
      body = fmMatch[2];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      const descMatch = fm.match(/^description:\s*["']?([\s\S]*?)["']?\s*$/m);
      if (nameMatch) name = nameMatch[1].trim();
      if (descMatch) description = descMatch[1].replace(/^["']|["']$/g, '').trim();
    } else {
      // Markdown heading fallback
      const h1 = content.match(/^#\s+(.+)$/m);
      if (h1) name = h1[1].trim();
      const descLine = content.match(/^description:\s*(.+)$/im);
      if (descLine) description = descLine[1].trim();
    }

    // Use full body as system prompt (trim frontmatter)
    const systemPrompt = body.trim() || content.trim();

    // Fallback description from first non-empty paragraph
    if (!description) {
      const firstPara = body.split('\n').find(l => l.trim() && !l.startsWith('#'));
      if (firstPara) description = firstPara.trim().slice(0, 200);
    }

    return { name: name || fallbackName, description, systemPrompt };
  };

  const handleFetchPreview = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    setImportPreview(null);
    try {
      const { url, skillName: parsedSkill } = parseImportInput(importUrl);
      const effectiveSkill = importSkillName.trim() || parsedSkill;
      if (parsedSkill && !importSkillName) setImportSkillName(parsedSkill);

      const candidates = buildCandidateUrls(url, effectiveSkill);
      let found = false;

      for (const rawUrl of candidates) {
        const res = await fetch(rawUrl);
        if (res.ok) {
          const text = await res.text();
          const clean = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
          const match = clean.match(/github\.com\/([^/]+)\/([^/\s]+)/);
          setImportPreview(parseSkillMd(text, effectiveSkill || match?.[2] || 'skill'));
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(
          `SKILL.md tidak ditemukan. Dicoba:\n${candidates.map(u => `• ${u}`).join('\n')}\n\nPastikan repo memiliki file SKILL.md.`
        );
      }
    } catch (e: any) {
      setImportError(e.message);
    }
    setImporting(false);
  };

  const handleImportConfirm = async () => {
    if (!user?.id || !importPreview) return;
    setImporting(true);
    try {
      const skill = await createSkill(user.id, {
        name: importPreview.name.toLowerCase().replace(/\s+/g, '-'),
        description: importPreview.description,
        systemPrompt: importPreview.systemPrompt,
      });
      setSkills(prev => [...prev, skill]);
      setSelected(skill);
      setShowImport(false);
      setImportUrl('');
      setImportSkillName('');
      setImportPreview(null);
    } catch (e: any) {
      setImportError(e.message);
    }
    setImporting(false);
  };

  // Fetch available skills from anthropics/skills repo
  const fetchBrowseList = async () => {
    if (browseList.length > 0) return; // already loaded
    setLoadingBrowse(true);
    try {
      const res = await fetch('https://api.github.com/repos/anthropics/skills/contents/skills');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBrowseList(data.filter((d: any) => d.type === 'dir').map((d: any) => d.name));
    } catch {
      setBrowseList([]);
    }
    setLoadingBrowse(false);
  };

  const handleBrowseSelect = (skillName: string) => {
    setImportUrl('https://github.com/anthropics/skills');
    setImportSkillName(skillName);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Top bar */}
      <div className="h-12 border-b border-stone-200 bg-white flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <span className="text-[13px] font-medium text-stone-600">Customize</span>
      </div>

      <div className="flex h-[calc(100vh-48px)]">
        {/* Left sidebar nav */}
        <div className="w-44 border-r border-stone-200 bg-white flex flex-col py-3 shrink-0">
          <button className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-stone-900 bg-stone-100 rounded-lg mx-2">
            <SquareTerminal size={15} strokeWidth={1.8} />
            Skills
          </button>
          <button
            onClick={() => navigate('/connectors')}
            className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-stone-500 hover:bg-stone-50 rounded-lg mx-2 mt-0.5 transition-colors"
          >
            <Wrench size={15} strokeWidth={1.8} />
            Connectors
          </button>
        </div>

        {/* Skills list */}
        <div className="w-52 border-r border-stone-200 bg-white flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <span className="text-[13px] font-semibold text-stone-800">Skills</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowImport(true)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                title="Import from GitHub"
              >
                <Github size={14} />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                title="New skill"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-stone-100">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg">
              <Search size={12} className="text-stone-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-[12px] bg-transparent outline-none text-stone-700 placeholder-stone-400"
              />
            </div>
          </div>

          {skills.some(s => !s.is_custom) && (
            <div className="px-4 py-2">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Examples</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-stone-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-stone-400">
                {search ? 'No results' : 'No skills yet'}
              </div>
            ) : (
              filtered.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => { setSelected(skill); setEditMode(false); setEditDraft(null); }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors ${
                    selected?.id === skill.id ? 'bg-stone-100' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="w-5 h-5 rounded bg-stone-200 flex items-center justify-center shrink-0">
                    <SquareTerminal size={11} className="text-stone-500" />
                  </div>
                  <span className="text-[12px] text-stone-700 truncate flex-1">{skill.name}</span>
                  {!skill.enabled && <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto bg-stone-50">
          {selected ? (
            <div className="max-w-xl mx-auto p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-[18px] font-semibold text-stone-900">{selected.name}</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(selected)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${selected.enabled ? 'bg-blue-500' : 'bg-stone-300'}`}
                    title={selected.enabled ? 'Disable skill' : 'Enable skill'}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selected.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                  <button
                    onClick={() => editMode ? cancelEdit() : startEdit(selected)}
                    className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-400 transition-colors"
                    title="Edit skill"
                  >
                    {editMode ? <X size={14} /> : <Edit2 size={14} />}
                  </button>
                  {selected.is_custom && (
                    <button
                      onClick={() => handleDelete(selected)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                      title="Delete skill"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-6 mb-5 text-[12px]">
                <div>
                  <span className="text-stone-400">Added by</span>
                  <p className="font-medium text-stone-700 mt-0.5">{selected.is_custom ? 'You' : 'Noir'}</p>
                </div>
                <div>
                  <span className="text-stone-400">Invoked by</span>
                  <p className="font-medium text-stone-700 mt-0.5">User or Noir</p>
                </div>
                <div>
                  <span className="text-stone-400">Status</span>
                  <p className={`font-medium mt-0.5 ${selected.enabled ? 'text-green-600' : 'text-stone-400'}`}>
                    {selected.enabled ? 'Active' : 'Disabled'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <p className="text-[12px] font-semibold text-stone-600 mb-1.5">Description</p>
                {editMode && editDraft ? (
                  <textarea
                    value={editDraft.description}
                    onChange={e => setEditDraft({ ...editDraft, description: e.target.value })}
                    className="w-full text-[13px] text-stone-700 bg-white border border-stone-200 rounded-xl p-3 outline-none focus:border-stone-400 resize-none min-h-[80px] transition-colors"
                  />
                ) : (
                  <p className="text-[13px] text-stone-600 leading-relaxed">{selected.description || '—'}</p>
                )}
              </div>

              {/* System Prompt */}
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <p className="text-[12px] font-semibold text-stone-600 mb-3">System Prompt</p>
                {editMode && editDraft ? (
                  <textarea
                    value={editDraft.system_prompt}
                    onChange={e => setEditDraft({ ...editDraft, system_prompt: e.target.value })}
                    className="w-full text-[13px] text-stone-700 bg-stone-50 border border-stone-200 rounded-lg p-3 outline-none focus:border-stone-400 resize-none min-h-[140px] font-mono transition-colors"
                  />
                ) : (
                  <p className="text-[13px] text-stone-600 leading-relaxed whitespace-pre-wrap font-mono">
                    {selected.system_prompt || '—'}
                  </p>
                )}
              </div>

              {editMode && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white text-[12px] font-medium rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save
                  </button>
                  <button onClick={cancelEdit} className="px-4 py-2 text-[12px] text-stone-500 hover:text-stone-700 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400">
              <SquareTerminal size={32} strokeWidth={1.2} />
              <p className="text-[13px]">Pilih skill untuk melihat detail</p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white text-[12px] font-medium rounded-lg hover:bg-stone-700 transition-colors mt-1"
              >
                <Plus size={13} /> Create skill
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Import from GitHub modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowImport(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
              onAnimationComplete={fetchBrowseList}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Github size={16} className="text-stone-600" />
                  <h2 className="text-[15px] font-semibold text-stone-900">Import from GitHub</h2>
                </div>
                <button onClick={() => { setShowImport(false); setImportPreview(null); setImportError(null); }} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
                  <X size={15} />
                </button>
              </div>
              <p className="text-[12px] text-stone-400 mb-5">
                Import skill dari repo GitHub yang memiliki file <code className="bg-stone-100 px-1 rounded">SKILL.md</code>
              </p>

              {!importPreview ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-medium text-stone-600 mb-1.5 block">GitHub repo URL</label>
                    <input
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://github.com/anthropics/skills  atau paste npx command"
                      className="w-full text-[13px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-stone-600 mb-1.5 block">
                      Skill name <span className="text-stone-400 font-normal">(opsional — untuk repo multi-skill)</span>
                    </label>
                    <input
                      value={importSkillName}
                      onChange={e => setImportSkillName(e.target.value)}
                      placeholder="e.g. pdf"
                      className="w-full text-[13px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 transition-colors"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Contoh: <code className="bg-stone-100 px-1 rounded">npx skills add https://github.com/anthropics/skills --skill pdf</code>
                    </p>
                  </div>

                  {/* Browse Anthropic Skills Library */}
                  <div>
                    <p className="text-[12px] font-medium text-stone-600 mb-2">Atau pilih dari Anthropic Skills Library:</p>
                    {loadingBrowse ? (
                      <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin text-stone-300" /></div>
                    ) : browseList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pb-1">
                        {browseList.map(name => (
                          <button
                            key={name}
                            onClick={() => handleBrowseSelect(name)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                              importSkillName === name
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {importError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      {importError}
                    </div>
                  )}
                  <button
                    onClick={handleFetchPreview}
                    disabled={!importUrl.trim() || importing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white text-[13px] font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40"
                  >
                    {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Fetch skill
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-stone-200 flex items-center justify-center">
                        <SquareTerminal size={12} className="text-stone-500" />
                      </div>
                      <span className="text-[14px] font-semibold text-stone-900">{importPreview.name}</span>
                    </div>
                    {importPreview.description && (
                      <p className="text-[12px] text-stone-600">{importPreview.description}</p>
                    )}
                    <div className="bg-white border border-stone-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-[11px] text-stone-400 font-semibold mb-1 uppercase tracking-wider">System Prompt Preview</p>
                      <p className="text-[11px] text-stone-600 font-mono whitespace-pre-wrap line-clamp-6">
                        {importPreview.systemPrompt.slice(0, 400)}{importPreview.systemPrompt.length > 400 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  {importError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      {importError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleImportConfirm}
                      disabled={importing}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white text-[13px] font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40"
                    >
                      {importing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Import skill
                    </button>
                    <button
                      onClick={() => setImportPreview(null)}
                      className="px-4 py-2.5 text-[13px] text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create skill modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-stone-900">Create new skill</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-stone-600 mb-1.5 block">Skill name</label>
                  <input
                    value={newSkill.name}
                    onChange={e => setNewSkill(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. code-reviewer"
                    className="w-full text-[13px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-stone-600 mb-1.5 block">Description</label>
                  <textarea
                    value={newSkill.description}
                    onChange={e => setNewSkill(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe what this skill does and when to use it..."
                    className="w-full text-[13px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 resize-none h-20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-stone-600 mb-1.5 block">System prompt</label>
                  <textarea
                    value={newSkill.systemPrompt}
                    onChange={e => setNewSkill(p => ({ ...p, systemPrompt: e.target.value }))}
                    placeholder="Instructions for the AI when this skill is active..."
                    className="w-full text-[13px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-stone-400 resize-none h-28 font-mono transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleCreate}
                  disabled={!newSkill.name.trim() || creating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-900 text-white text-[13px] font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create skill
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-[13px] text-stone-500 hover:text-stone-700 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillsPage;
