import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@/lib/authContext';
import Logo from '../Logo';
import { Loader2, ArrowRight, User } from 'lucide-react';
import { motion } from 'framer-motion';

const NicknamePage: React.FC = () => {
    const { updateProfile } = useAuth();
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nickname.trim()) {
            setError('Nickname tidak boleh kosong');
            return;
        }

        if (nickname.length < 3) {
            setError('Nickname minimal 3 karakter');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await updateProfile({ nickname: nickname.trim() });

            if (error) {
                setError(error.message);
            } else {
                // Success - redirect to home
                navigate('/', { replace: true });
            }
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan nickname');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-8">
                    <div className="flex justify-center mb-8">
                        <div className="p-3 bg-purple-100 rounded-2xl">
                            <Logo size={32} className="text-purple-600" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Selamat Datang di Nevra!</h1>
                        <p className="text-zinc-500">
                            Sebelum mulai, mau dipanggil apa nih?
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Nickname</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-zinc-400"
                                    placeholder="Ketik panggilanmu..."
                                    maxLength={20}
                                    autoFocus
                                />
                            </div>
                            <p className="mt-2 text-xs text-zinc-400">
                                Nama ini akan digunakan Nevra saat menyapamu.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !nickname.trim()}
                            className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Lanjut
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default NicknamePage;
