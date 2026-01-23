import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import Logo from '../Logo';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const SignInPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signInWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const from = (location.state as any)?.from || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Logic handled by AuthProvider/ProtectedRoute usually, 
            // but explicit navigation is good.
            navigate(from, { replace: true });
        }
    };

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Card Container */}
                <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-8 md:p-10">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex justify-center mb-6">
                            <div className="p-3 bg-purple-50 rounded-2xl">
                                <Logo size={32} className="text-purple-600" />
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Welcome Back</h1>
                        <p className="text-zinc-500">Sign in to continue to Noir AI</p>
                    </div>

                    {/* Social Login */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full mb-6 flex items-center justify-center gap-3 px-6 py-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="font-medium text-zinc-700">Continue with Google</span>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-zinc-400">or sign in with email</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <span className="block w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-zinc-400"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-medium text-zinc-700">Password</label>
                                <Link to="/forgot-password" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-zinc-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3.5 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/30"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-zinc-500 text-sm">
                            Don't have an account?{' '}
                            <Link to="/sign-up" className="font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-zinc-400">
                        Protected by reCAPTCHA and Subject to the Noir AI{' '}
                        <a href="#" className="underline hover:text-zinc-500">Privacy Policy</a>
                        {' '}and{' '}
                        <a href="#" className="underline hover:text-zinc-500">Terms of Service</a>.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignInPage;
