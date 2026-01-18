import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useUser } from '@/lib/authContext';
import Logo from '../Logo';
import { Loader2, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPasswordPage: React.FC = () => {
    const { resetPassword } = useAuth();
    const { isSignedIn, isLoaded } = useUser();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if already signed in
    React.useEffect(() => {
        if (isSignedIn) {
            navigate('/');
        }
    }, [isSignedIn, navigate]);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        setError(null);

        try {
            const { error } = await resetPassword(email);
            if (error) {
                setError(error.message);
            } else {
                setIsSent(true);
            }
        } catch (err: any) {
            console.error(err);
            setError("Gagal mengirim email reset.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#05100a] text-white">
                <Loader2 className="animate-spin text-[#4ADE80]" size={32} />
            </div>
        );
    }

    if (isSent) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">Cek Email Kamu!</h2>
                    <p className="text-zinc-500 mb-6">
                        Kami telah mengirim link reset password ke <span className="font-medium text-zinc-900">{email}</span>
                    </p>
                    <p className="text-sm text-zinc-400 mb-6">
                        Klik link di email untuk mengatur ulang password kamu. Jika tidak ada, cek folder spam.
                    </p>
                    <Link
                        to="/sign-in"
                        className="inline-block px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                    >
                        Ke Halaman Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05100a] text-white relative overflow-hidden flex flex-col font-sans">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#4ADE80] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#22C55E] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse-slow delay-75"></div>

            {/* Navbar */}
            <nav className="relative z-10 flex justify-between items-center p-6 md:px-12">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/20 backdrop-blur-md">
                        <Logo size={24} color="#4ADE80" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white/90">NEVRA</span>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[460px]"
                >
                    <div className="bg-[#0A1A10]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        {/* Glass Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-3 text-white">
                                Lupa Kata Sandi?
                            </h1>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Jangan khawatir. Masukkan email yang tertaut dengan akun Anda dan kami akan mengirimkan link reset.
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm mb-6"
                            >
                                <AlertCircle size={16} className="shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleRequestReset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                                <div className="relative group/input">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#4ADE80] transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white border-none rounded-xl py-3.5 pl-11 pr-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] transition-all"
                                        placeholder="nama@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    "Kirim Link Reset"
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <Link to="/sign-in" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft size={16} />
                                Kembali ke halaman login
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
