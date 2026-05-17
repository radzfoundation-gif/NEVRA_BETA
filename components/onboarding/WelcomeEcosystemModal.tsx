import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Coins, ArrowRight } from 'lucide-react';

interface WelcomeEcosystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimed?: () => void;
}

const STORAGE_KEY = 'useglass_welcome_modal_seen';
const CREDIT_KEY = 'useglass_welcome_credits_claimed';

export default function WelcomeEcosystemModal({ isOpen, onClose, onClaimed }: WelcomeEcosystemModalProps) {
  const [step, setStep] = useState<'welcome' | 'credits'>('welcome');

  useEffect(() => {
    if (!isOpen) return;
    setStep('welcome');
    if (typeof document !== 'undefined') {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    onClose();
  };

  const handleGetStarted = () => {
    setStep('credits');
  };

  const handleClaimCredits = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem(CREDIT_KEY, 'true');
    } catch {}
    onClaimed?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden overscroll-none p-3 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
            onClick={handleClose}
          />

          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] sm:rounded-[32px] shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-modal-title"
            >
              <div
                className="relative w-full bg-cover bg-center bg-no-repeat aspect-[4/3] sm:aspect-[16/10]"
                style={{ backgroundImage: 'url(/pop%20up.png)' }}
              >
                <button
                  onClick={handleClose}
                  aria-label="Close welcome modal"
                  className="absolute right-3 top-3 sm:right-5 sm:top-5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-zinc-800 shadow-md transition active:scale-95 hover:bg-zinc-50 [touch-action:manipulation]"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>

                <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-5 sm:pb-8">
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-white px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-blue-700 shadow-[0_14px_40px_rgba(15,23,42,0.25)] transition active:scale-[0.98] hover:bg-white/95 [touch-action:manipulation]"
                  >
                    <Coins size={16} strokeWidth={2.4} />
                    Claim Credit
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </button>
                </div>

                <h2 id="welcome-modal-title" className="sr-only">Join the UseGlass Ecosystem</h2>
              </div>
            </motion.div>
          )}

          {step === 'credits' && (
            <motion.div
              key="credits"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="credit-modal-title"
            >
              <div className="relative bg-[linear-gradient(160deg,#3a86ff_0%,#1f6dd6_100%)] px-6 pt-8 pb-10 text-center text-white">
                <button
                  onClick={handleClose}
                  aria-label="Close credit modal"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-800 shadow-sm transition active:scale-95 hover:bg-white [touch-action:manipulation]"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/40">
                    <Coins size={28} strokeWidth={2} />
                  </span>
                  <h2 id="credit-modal-title" className="mt-5 text-2xl font-bold tracking-tight">
                    You&apos;ve unlocked 100 free credits
                  </h2>
                  <p className="mt-2 max-w-xs text-sm text-white/85">
                    Use them to chat, build, and explore UseGlass AI. New credits refresh every cycle.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-5 sm:p-6">
                <button
                  onClick={handleClaimCredits}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(15,23,42,0.2)] transition active:bg-black hover:bg-zinc-800 [touch-action:manipulation]"
                >
                  Claim 100 credits
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleClose}
                  className="min-h-[44px] text-sm font-medium text-zinc-500 transition hover:text-zinc-800 [touch-action:manipulation]"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
