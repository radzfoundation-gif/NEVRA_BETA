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
            setError("Failed to send reset email.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50">
                <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
        );
    }

    if (isSent) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-3">Check Your Email</h2>
                    <p className="text-zinc-500 mb-6 leading-relaxed">
                        We have sent a password reset link to <span className="font-semibold text-zinc-900">{email}</span>
                    </p>
                    <p className="text-xs text-zinc-400 mb-8">
                        Click the link in the email to reset your password. If you don't see it, checking your spam folder usually helps.
                    </p>
                    <Link
                        to="/sign-in"
                        className="inline-block w-full py-3.5 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20"
                    >
                        Back to Sign In
                    </Link>
                </motion.div>
            </div>
        );
    }

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
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Forgot Password?</h1>
                        <p className="text-zinc-500">Don't worry, we'll send you reset instructions.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRequestReset} className="space-y-6">
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/30"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/sign-in" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium">
                            <ArrowLeft size={16} />
                            Back to log in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
