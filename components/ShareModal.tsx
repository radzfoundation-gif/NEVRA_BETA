import React, { useState } from 'react';
import { X, Copy, Check, Share2, Facebook, Twitter, Linkedin, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl?: string;
    title?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, title }) => {
    const [copied, setCopied] = useState(false);
    // Use provided shareUrl or default to referral link (or current page if suitable)
    const linkToShare = shareUrl || 'https://noir-ai.com/invite/u/radzfoundation';
    const isReferral = !shareUrl; // If no specific URL provided, assume it's the referral/invite mode

    const handleCopy = () => {
        navigator.clipboard.writeText(linkToShare);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        { icon: Twitter, label: 'Twitter', color: 'bg-black text-white' },
        { icon: Facebook, label: 'Facebook', color: 'bg-blue-600 text-white' },
        { icon: Linkedin, label: 'LinkedIn', color: 'bg-blue-700 text-white' },
        { icon: Send, label: 'WhatsApp', color: 'bg-green-500 text-white' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white pointer-events-auto border border-zinc-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-purple-600" />
                                        {title || (isReferral ? 'Share with Friends' : 'Share Chat')}
                                    </h2>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        {isReferral ? 'Invite friends and unlock Pro features!' : 'Share this conversation via link or social media.'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Link Field */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">
                                        {isReferral ? 'Your Referral Link' : 'Chat Link'}
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-600 truncate font-mono">
                                            {linkToShare}
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium text-sm"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Share Buttons */}
                                <div className="grid grid-cols-4 gap-4">
                                    {shareOptions.map((opt) => (
                                        <button
                                            key={opt.label}
                                            className={`flex flex-col items-center gap-2 group`}
                                            onClick={() => {
                                                // Basic social share implementation
                                                let url = '';
                                                switch (opt.label) {
                                                    case 'Twitter': url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(linkToShare)}`; break;
                                                    case 'Facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkToShare)}`; break;
                                                    case 'LinkedIn': url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkToShare)}`; break;
                                                    case 'WhatsApp': url = `https://wa.me/?text=${encodeURIComponent(linkToShare)}`; break;
                                                }
                                                if (url) window.open(url, '_blank');
                                            }}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${opt.color}`}>
                                                <opt.icon size={20} />
                                            </div>
                                            <span className="text-xs font-medium text-zinc-600">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Reward Info - Only for Referral Mode */}
                                {isReferral && (
                                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                            <Share2 className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-purple-900">Get 1 Month Free Pro</h4>
                                            <p className="text-sm text-purple-700 mt-1">
                                                For every 3 friends who sign up using your link, you get 1 month of Pro features for free.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
