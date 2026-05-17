import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, Edit2, X, Check, SquareTerminal, Wrench, Loader2, Github, Download, AlertCircle, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/lib/authContext';
import { getSkills, createSkill, updateSkill, deleteSkill, UserSkill } from '@/lib/skillsApi';
import Sidebar from '../Sidebar';
import ConnectorsList from '../connectors/ConnectorsList';

const SkillsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [selected, setSelected] = useState<UserSkill | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9F9] overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto w-full">
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">My Skills</h1>
                    <p className="text-zinc-500">Manage your custom AI instructions and tools.</p>
                </div>
                <button
                    onClick={() => navigate('/skills/import')}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-white px-4 py-2 text-sm hover:bg-zinc-800 shrink-0"
                >
                    <Upload size={14} /> Import
                </button>
            </div>
            {loading ? <Loader2 className="animate-spin text-zinc-400" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map(skill => (
                        <div key={skill.id} className="p-5 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-all">
                            <h3 className="font-semibold text-zinc-900 mb-1">{skill.name}</h3>
                            <p className="text-sm text-zinc-500 line-clamp-2">{skill.description}</p>
                        </div>
                    ))}
                </div>
            )}

            <section className="mt-10">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-zinc-900">Glass Connectors</h2>
                    <p className="text-sm text-zinc-500">Connect UseGlass AI to your tools.</p>
                </div>
                <ConnectorsList variant="page" />
            </section>
        </div>
      </div>
    </div>
  );
};

export default SkillsPage;
