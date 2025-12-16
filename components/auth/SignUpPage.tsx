import React, { useState, useEffect } from 'react';
import { useSignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '../Logo';
import {
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    Mail,
    Lock,
    User,
    ArrowRight,
    Github,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Google Icon component
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.29-.19-.55z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const SignUpPage: React.FC = () => {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { isSignedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get the intended destination from location state
    const from = (location.state as any)?.from || '/';

    // Redirect if already signed in
    useEffect(() => {
        if (isSignedIn) {
            navigate(from, { replace: true });
        }
    }, [isSignedIn, navigate, from]);

    const handleOAuth = async (strategy: 'oauth_google' | 'oauth_github') => {
        if (!isLoaded) return;
        try {
            await signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: '/sso-callback',
                redirectUrlComplete: from
            });
        } catch (err: any) {
            console.error("OAuth Error:", err);
            setError("Gagal memulai login sosial.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        if (password !== confirmPassword) {
            setError("Kata sandi dan konfirmasi kata sandi tidak cocok.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Split full name into first and last name
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            await signUp.create({
                firstName,
                lastName,
                emailAddress: email,
                password,
            });

            // Send email verification code
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

            setVerifying(true);
        } catch (err: any) {
            console.error(err);
            if (err.errors && err.errors.length > 0) {
                setError(err.errors[0].message);
            } else {
                setError("Terjadi kesalahan saat pendaftaran.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError(null);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                navigate(from, { replace: true });
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
                setError("Verifikasi belum selesai. Silakan cek kode Anda.");
            }
        } catch (err: any) {
            console.error(err);
            if (err.errors && err.errors.length > 0) {
                setError(err.errors[0].message); // Use Clerk's message for better context
            } else {
                setError("Kode verifikasi salah atau kadaluarsa.");
            }
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

            {/* Navbar Simple */}
            <nav className="relative z-10 flex justify-between items-center p-6 md:px-12">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/20 backdrop-blur-md">
                        <Logo size={24} color="#4ADE80" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white/90">NEVRA</span>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-gray-400 hidden sm:inline">Sudah punya akun?</span>
                    <Link
                        to="/sign-in"
                        state={{ from }}
                        className="px-5 py-2.5 rounded-full border border-white/10 hover:border-[#4ADE80]/50 hover:bg-[#4ADE80]/5 text-white transition-all duration-300"
                    >
                        Masuk
                    </Link>
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
                                {verifying ? "Verifikasi Email" : "Buat Akun Baru"}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {verifying
                                    ? `Kami telah mengirim kode ke ${email}`
                                    : "Bergabunglah dengan komunitas kami hari ini."}
                            </p>
                        </div>

                        <AnimatePresence mode='wait'>
                            {/* REGISTER FORM */}
                            {/* REGISTER FORM */}
                            {!verifying ? (
                                <motion.form
                                    key="register-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    {/* Full Name Field */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#4ADE80] transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-white border-none rounded-xl py-3.5 pl-11 pr-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] transition-all"
                                                placeholder="Masukkan nama lengkap Anda"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Alamat Email</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#4ADE80] transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white border-none rounded-xl py-3.5 pl-11 pr-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] transition-all"
                                                placeholder="nama@contoh.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Kata Sandi</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#4ADE80] transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-white border-none rounded-xl py-3.5 pl-11 pr-11 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] transition-all"
                                                placeholder="Minimal 8 karakter"
                                                minLength={8}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Konfirmasi Kata Sandi</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-[#4ADE80] transition-colors">
                                                <div className="rotate-0 transition-transform duration-300">
                                                    <Lock size={18} />
                                                </div>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-white border-none rounded-xl py-3.5 pl-11 pr-11 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] transition-all"
                                                placeholder="Ulangi kata sandi"
                                                minLength={8}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm"
                                        >
                                            <AlertCircle size={16} className="shrink-0" />
                                            <p>{error}</p>
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#4ADE80] hover:bg-[#3ec46d] text-black font-bold py-3.5 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#4ADE80]/20 flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                Daftar Sekarang
                                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    {/* Clerk Captcha Container */}
                                    <div id="clerk-captcha" />

                                    <div className="flex items-center gap-4 my-6">
                                        <div className="h-px bg-white/10 flex-1"></div>
                                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Atau daftar dengan</span>
                                        <div className="h-px bg-white/10 flex-1"></div>
                                    </div>

                                    <div className="flex justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleOAuth('oauth_google')}
                                            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full transition-all duration-300 group/social"
                                        >
                                            <div className="group-hover/social:scale-110 transition-transform">
                                                <GoogleIcon />
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOAuth('oauth_github')}
                                            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full transition-all duration-300 group/social"
                                        >
                                            <div className="group-hover/social:scale-110 transition-transform">
                                                <Github size={20} className="text-white" />
                                            </div>
                                        </button>
                                    </div>
                                </motion.form>
                            ) : (
                                /* VERIFICATION FORM */
                                <motion.form
                                    key="verification-form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleVerify}
                                    className="space-y-6"
                                >
                                    <div className="text-center bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-xl p-4 mb-4">
                                        <CheckCircle2 className="mx-auto text-[#4ADE80] mb-2" size={32} />
                                        <p className="text-sm text-[#4ADE80] font-medium">Kode verifikasi telah dikirim ke email Anda</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Kode Verifikasi</label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="w-full bg-[#05100a]/50 border border-white/10 rounded-xl py-4 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder-gray-700 focus:outline-none focus:border-[#4ADE80]/50 focus:ring-1 focus:ring-[#4ADE80]/50 transition-all uppercase"
                                            placeholder="••••••"
                                            maxLength={6}
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-black font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#4ADE80]/20 flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                Verifikasi & Masuk
                                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setVerifying(false)}
                                        className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
                                    >
                                        Kembali
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-500 px-4">
                        <p>Dengan mendaftar, Anda menyetujui <Link to="/terms" className="hover:text-gray-300 transition-colors">Syarat & Ketentuan</Link> kami</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SignUpPage;
