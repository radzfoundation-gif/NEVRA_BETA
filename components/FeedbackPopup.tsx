import React, { useState } from 'react';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import { markFeedbackGiven } from '@/lib/database';
import { useUser } from '@clerk/clerk-react';

interface FeedbackPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            // 1. Construct WhatsApp URL
            const phoneNumber = '6285155031983';
            const text = encodeURIComponent(
                `*New Feedback for NEVRA*\n\n` +
                `Rating: ${'⭐'.repeat(rating)}\n` +
                `User: ${user?.fullName || 'Anonymous'}\n` +
                `Feedback: ${feedback || 'No text feedback provided.'}`
            );
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;

            // 2. Open WhatsApp
            window.open(whatsappUrl, '_blank');

            // 3. Mark feedback as given in DB
            if (user) {
                await markFeedbackGiven(user.id);
            }

            // 4. Close popup
            onClose();
        } catch (error) {
            console.error('Error sending feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                        <MessageSquare className="text-purple-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">We value your feedback!</h3>
                    <p className="text-gray-400 text-sm">How is your experience with Nevra so far?</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`transition-colors ${star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-600'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Feedback Text */}
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us what you think... (optional)"
                        className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none h-24"
                    />

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Feedback on WhatsApp'}
                        {!isSubmitting && <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPopup;
