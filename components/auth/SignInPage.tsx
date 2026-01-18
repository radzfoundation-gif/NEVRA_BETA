import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import Logo from '../Logo';
import { Loader2, Eye, EyeOff } from 'lucide-react';

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
            navigate(from, { replace: true });
        }
    };

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
    };

    return (
        <div className="min-h-screen bg-[#8B8B9B] flex items-center justify-center p-4 md:p-8">
            {/* Main Container */}
            <div className="w-full max-w-6xl bg-gradient-to-br from-[#FEF9E7] via-[#FDF6E3] to-[#FCF3D9] rounded-[32px] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]">

                {/* Left Side - Form */}
                <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col">
                    {/* Logo */}
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/50">
                            <Logo size={20} className="text-zinc-800" />
                            <span className="font-semibold text-zinc-800">Nevra</span>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 flex flex-col justify-center max-w-md">
                        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-2">
                            Welcome back
                        </h1>
                        <p className="text-zinc-500 mb-8">
                            Sign in to continue your learning journey
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-500 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm border-0 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                                    placeholder="you@email.com"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-500 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 pr-14 bg-white/70 backdrop-blur-sm border-0 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                                        placeholder="••••••••••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <Link to="/forgot-password" className="text-sm text-zinc-500 hover:text-zinc-900">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-zinc-900 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-300/50 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Submit'
                                )}
                            </button>
                        </form>

                        {/* OAuth Buttons */}
                        <div className="flex gap-4 mt-6">
                            <button
                                type="button"
                                className="flex-1 flex items-center justify-center gap-3 px-6 py-3.5 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 border border-white/50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <span className="font-medium text-zinc-700">Apple</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="flex-1 flex items-center justify-center gap-3 px-6 py-3.5 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 border border-white/50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="font-medium text-zinc-700">Google</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-8 text-sm">
                        <p className="text-zinc-500">
                            Don't have an account?{' '}
                            <Link to="/sign-up" className="font-medium text-zinc-900 hover:underline">
                                Sign up
                            </Link>
                        </p>
                        <Link to="/terms" className="text-zinc-500 hover:text-zinc-900 underline">
                            Terms & Conditions
                        </Link>
                    </div>
                </div>

                {/* Right Side - Image/Illustration */}
                <div className="hidden lg:block flex-1 relative p-6">
                    <div className="w-full h-full rounded-[24px] overflow-hidden relative bg-gradient-to-br from-amber-100 to-yellow-100">
                        {/* Decorative Image Placeholder */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 to-yellow-200/50" />

                        {/* Decorative Elements */}
                        <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Welcome Back!</p>
                                    <p className="text-xs text-zinc-500">Continue your journey</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-24 left-8 right-8 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white"></div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-white"></div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 border-2 border-white"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Active Learners</p>
                                    <p className="text-xs text-zinc-500">Learning right now</p>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors shadow-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-100/80 via-transparent to-transparent" />

                        {/* Decorative Pattern */}
                        <div className="absolute inset-0 opacity-30" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignInPage;
