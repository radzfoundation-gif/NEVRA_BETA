import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Youtube, Instagram, Twitter, MessageCircle, Globe, ChevronRight, Zap, Gauge, Bug, Palette, FileText, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/authContext';
import { updateUserPreferences } from '@/lib/supabaseDatabase';

const referralOptions = [
    { id: 'tiktok', label: 'TikTok', icon: MessageCircle },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'x-twitter', label: 'X / Twitter', icon: Twitter },
    { id: 'google-search', label: 'Google Search', icon: Search },
    { id: 'friend-colleague', label: 'Friend or colleague', icon: MessageCircle },
    { id: 'community', label: 'AI community', icon: Globe },
    { id: 'other', label: 'Other', icon: Globe },
];

const performanceOptions = [
    { id: 'faster-chat', label: 'Faster chat responses', icon: Zap },
    { id: 'better-canvas', label: 'Better canvas previews', icon: Palette },
    { id: 'fewer-errors', label: 'Fewer errors and retries', icon: Bug },
    { id: 'better-documents', label: 'Better PDF and documents', icon: FileText },
    { id: 'smoother-ui', label: 'Smoother workspace performance', icon: Gauge },
    { id: 'better-research', label: 'Better research quality', icon: Search },
];

const SurveyPage = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [referralSource, setReferralSource] = useState<string | null>(null);
    const [performanceFocus, setPerformanceFocus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canContinue = Boolean(referralSource && performanceFocus);

    const handleContinue = async () => {
        if (!canContinue) return;
        setIsSubmitting(true);
        try {
            if (user) {
                await updateUserPreferences(user.id, {
                    preferences: {
                        referral_source: referralSource,
                        performance_focus: performanceFocus,
                        onboarding_survey_completed: true,
                        survey_completed_at: new Date().toISOString(),
                    }
                });
            }
            localStorage.setItem('useglass_onboarding_survey_completed', 'true');
            navigate('/chat', { replace: true });
        } catch (error) {
            localStorage.setItem('useglass_onboarding_survey_completed', 'true');
            navigate('/chat', { replace: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_48%,#eef6ff_100%)] p-4 pt-safe pb-safe sm:p-6">
            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-200/30 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-200/30 blur-[90px]" />

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-3xl rounded-3xl sm:rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6 md:p-8"
            >
                <div className="mb-6 sm:mb-7 text-center">
                    <div className="mx-auto mb-4 inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        Help improve UseGlass AI
                    </div>
                    <h1 className="mb-2 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl md:text-3xl">Quick onboarding survey</h1>
                    <p className="mx-auto max-w-xl text-sm leading-6 text-zinc-500">
                        Two quick answers help us improve UseGlass AI performance and understand how people discover the product.
                    </p>
                </div>

                <section className="mb-6 sm:mb-7">
                    <h2 className="mb-3 text-sm font-semibold text-zinc-900">Where did you hear about UseGlass AI?</h2>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
                        {referralOptions.map((option) => {
                            const selected = referralSource === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setReferralSource(option.id)}
                                    className={`relative flex min-h-[88px] sm:min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center text-sm transition-all [touch-action:manipulation] ${selected ? 'border-sky-300 bg-sky-50 text-sky-800 shadow-sm' : 'border-zinc-100 bg-white text-zinc-600 active:bg-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'}`}
                                >
                                    <option.icon size={20} />
                                    <span className="font-medium">{option.label}</span>
                                    {selected && <span className="absolute right-2 top-2 rounded-full bg-sky-600 p-1 text-white"><Check size={10} strokeWidth={4} /></span>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <h2 className="mb-3 text-sm font-semibold text-zinc-900">What should UseGlass AI improve first?</h2>
                    <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
                        {performanceOptions.map((option) => {
                            const selected = performanceFocus === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setPerformanceFocus(option.id)}
                                    className={`relative flex min-h-[64px] items-center gap-3 rounded-2xl border p-3.5 sm:p-4 text-left text-sm transition-all [touch-action:manipulation] ${selected ? 'border-blue-300 bg-blue-50 text-blue-800 shadow-sm' : 'border-zinc-100 bg-white text-zinc-600 active:bg-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'}`}
                                >
                                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-blue-100' : 'bg-zinc-50'}`}>
                                        <option.icon size={18} />
                                    </span>
                                    <span className="font-medium">{option.label}</span>
                                    {selected && <span className="ml-auto rounded-full bg-blue-600 p-1 text-white"><Check size={10} strokeWidth={4} /></span>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="mt-7 sm:mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/chat', { replace: true })}
                        className="min-h-[44px] text-sm font-medium text-zinc-400 transition active:text-zinc-800 hover:text-zinc-700 [touch-action:manipulation]"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!canContinue || isSubmitting}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(15,23,42,0.18)] transition active:bg-black hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 [touch-action:manipulation]"
                    >
                        {isSubmitting ? 'Saving...' : 'Continue to UseGlass'}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SurveyPage;
