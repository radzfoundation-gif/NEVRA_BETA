import React, { useState } from 'react';
import { X, Check, Zap, Code2, Globe, Brain, Image, FileText, Calculator, Music, Video, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  systemPromptAddition?: string;
}

export const AVAILABLE_SKILLS: Skill[] = [
  {
    id: 'code_interpreter',
    name: 'Code Interpreter',
    description: 'Jalankan & debug kode secara langsung',
    icon: Code2,
    color: 'text-blue-600',
    badge: 'Popular',
    systemPromptAddition: 'You can write and explain executable code. Always provide runnable examples.',
  },
  {
    id: 'web_researcher',
    name: 'Web Researcher',
    description: 'Cari & rangkum informasi dari web',
    icon: Globe,
    color: 'text-green-600',
    badge: 'Popular',
    systemPromptAddition: 'You are an expert web researcher. Provide well-sourced, up-to-date information.',
  },
  {
    id: 'deep_analyst',
    name: 'Deep Analyst',
    description: 'Analisis mendalam & reasoning kompleks',
    icon: Brain,
    color: 'text-purple-600',
    systemPromptAddition: 'You are a deep analytical thinker. Break down complex problems step by step with rigorous reasoning.',
  },
  {
    id: 'image_gen',
    name: 'Image Generator',
    description: 'Buat prompt gambar yang optimal',
    icon: Image,
    color: 'text-pink-600',
    systemPromptAddition: 'You are an expert at crafting detailed image generation prompts for AI art tools like Midjourney, DALL-E, and Stable Diffusion.',
  },
  {
    id: 'doc_writer',
    name: 'Document Writer',
    description: 'Tulis dokumen, laporan & presentasi',
    icon: FileText,
    color: 'text-orange-600',
    systemPromptAddition: 'You are a professional document writer. Structure content clearly with proper headings, formatting, and professional tone.',
  },
  {
    id: 'math_solver',
    name: 'Math Solver',
    description: 'Selesaikan soal matematika step-by-step',
    icon: Calculator,
    color: 'text-red-600',
    systemPromptAddition: 'You are a math expert. Always solve problems step by step, showing all work clearly with proper notation.',
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Analisis data & buat visualisasi',
    icon: Database,
    color: 'text-cyan-600',
    systemPromptAddition: 'You are a data analyst expert. Help interpret data, suggest visualizations, and provide statistical insights.',
  },
  {
    id: 'creative_writer',
    name: 'Creative Writer',
    description: 'Tulis cerita, puisi & konten kreatif',
    icon: Zap,
    color: 'text-yellow-600',
    systemPromptAddition: 'You are a creative writer with a vivid imagination. Craft engaging, original content with compelling narratives.',
  },
];

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSkills: string[];
  onToggleSkill: (skillId: string) => void;
}

const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, onClose, activeSkills, onToggleSkill }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Zap size={16} className="text-stone-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-stone-900">Skills</h2>
                  <p className="text-[11px] text-stone-400">
                    {activeSkills.length > 0 ? `${activeSkills.length} skill aktif` : 'Aktifkan kemampuan tambahan'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Skills Grid */}
            <div className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto">
              {AVAILABLE_SKILLS.map((skill) => {
                const Icon = skill.icon;
                const isActive = activeSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => onToggleSkill(skill.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/10' : 'bg-stone-100'}`}>
                      <Icon size={16} className={isActive ? 'text-white' : skill.color} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-medium ${isActive ? 'text-white' : 'text-stone-900'}`}>{skill.name}</span>
                        {skill.badge && !isActive && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                            {skill.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate ${isActive ? 'text-white/70' : 'text-stone-500'}`}>{skill.description}</p>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            {activeSkills.length > 0 && (
              <div className="px-4 pb-4 pt-1">
                <button
                  onClick={() => activeSkills.forEach(id => onToggleSkill(id))}
                  className="w-full py-2 text-[12px] text-stone-500 hover:text-red-500 transition-colors"
                >
                  Nonaktifkan semua skill
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SkillsModal;
