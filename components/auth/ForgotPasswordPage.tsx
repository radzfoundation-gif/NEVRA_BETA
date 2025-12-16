import React, { useState } from 'react';
import { useSignIn, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../Logo';
import { Loader2, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPasswordPage: React.FC = () => {
    const { isLoaded, signIn, setActive } = useSignIn();
    const { isSignedIn } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'request' | 'reset'>('request');

    // Redirect if already signed in
    React.useEffect(() => {
        if (isSignedIn) {
            navigate('/');
        }
    }, [isSignedIn, navigate]);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError(null);

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });
            setIsSent(true);
            setStep('reset');
        } catch (err: any) {
            console.error(err);
            if (err.errors && err.errors[0]?.code === 'form_identifier_not_found') {
                setError("Email tidak ditemukan.");
            } else {
                setError(err.errors?.[0]?.message || "Gagal mengirim email reset.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                navigate('/');
            } else {
                console.error(result);
                setError("Gagal mereset kata sandi.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.errors?.[0]?.message || "Kode salah atau kadaluarsa.");
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
                                {step === 'request' ? "Lupa Kata Sandi?" : "Atur Ulang Sandi"}
                            </h1>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {step === 'request'
                                    ? "Jangan khawatir. Masukkan email yang tertaut dengan akun Anda dan kami akan mengirimkan kode reset."
                                    : "Masukkan kode verifikasi yang dikirim ke email Anda dan kata sandi baru."}
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

                        {step === 'request' ? (
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
                                        "Kirim Kode Reset"
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Kode Verifikasi</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full bg-white border-none rounded-xl py-3.5 px-4 text-black placeholder-gray-400 text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#4ADE80] transition-all"
                                        placeholder="######"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Kata Sandi Baru</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white border-none rounded-xl py-3.5 px-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] transition-all"
                                        placeholder="Kata sandi baru"
                                        required
                                        minLength={8}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-black font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#4ADE80]/20 flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        "Ubah Kata Sandi"
                                    )}
                                </button>
                            </form>
                        )}

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
