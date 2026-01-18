import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Youtube, Instagram, Twitter, MessageCircle, Globe, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/authContext';
import { updateUserPreferences } from '@/lib/supabaseDatabase';

const SurveyPage = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const options = [
        { id: 'tiktok', label: 'TikTok', icon: MessageCircle, color: 'hover:bg-black hover:text-white' }, // TikTok icon filler
        { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'hover:bg-pink-600 hover:text-white' },
        { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'hover:bg-red-600 hover:text-white' },
        { id: 'twitter', label: 'X (Twitter)', icon: Twitter, color: 'hover:bg-black hover:text-white' },
        { id: 'friend', label: 'Friend / Colleague', icon: MessageCircle, color: 'hover:bg-blue-600 hover:text-white' },
        { id: 'other', label: 'Other', icon: Globe, color: 'hover:bg-purple-600 hover:text-white' },
    ];

    const handleContinue = async () => {
        if (selectedOption && user) {
            setIsSubmitting(true);
            try {
                console.log('Saving survey response:', selectedOption);
                // Save to Firebase User Preferences
                await updateUserPreferences(user.id, {
                    preferences: {
                        referral_source: selectedOption,
                        survey_completed_at: new Date().toISOString()
                    }
                });

                // Redirect to chat
                navigate('/chat');
            } catch (error) {
                console.error('Error saving survey:', error);
                // Fail gracefully - still redirect
                navigate('/chat');
            } finally {
                setIsSubmitting(false);
            }
        } else if (selectedOption) {
            // Fallback if user is not loaded yet (shouldn't happen in protected route but just in case)
            navigate('/chat');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden p-6">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 relativ z-10"
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">One last thing...</h2>
                    <p className="text-zinc-500">Where did you hear about Nevra?</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setSelectedOption(option.id)}
                            className={`
                relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-200 group
                ${selectedOption === option.id
                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg scale-[1.02]'
                                    : 'bg-white text-zinc-600 border-zinc-100 hover:border-zinc-300 hover:shadow-md'
                                }
              `}
                        >
                            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${selectedOption === option.id ? 'bg-white/10' : 'bg-zinc-50 group-hover:bg-zinc-100'}
              `}>
                                <option.icon size={20} />
                            </div>
                            <span className="font-medium text-sm">{option.label}</span>

                            {selectedOption === option.id && (
                                <div className="absolute top-3 right-3">
                                    <div className="w-5 h-5 rounded-full bg-white text-zinc-900 flex items-center justify-center">
                                        <Check size={10} strokeWidth={4} />
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleContinue}
                    disabled={!selectedOption}
                    className={`
            w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200
            ${selectedOption
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]'
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        }
          `}
                >
                    Continue
                    <ChevronRight size={18} />
                </button>
            </motion.div>
        </div>
    );
};

export default SurveyPage;
