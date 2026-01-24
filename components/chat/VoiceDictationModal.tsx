import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceDictationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (text: string) => void;
    initialText?: string;
}

export default function VoiceDictationModal({
    isOpen,
    onClose,
    onInsert,
    initialText = ''
}: VoiceDictationModalProps) {
    const [transcript, setTranscript] = useState(initialText);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>(0);

    // Initialize Speech Recognition & Audio Visualizer
    useEffect(() => {
        if (isOpen) {
            startDictation();
        } else {
            stopDictation();
        }

        return () => {
            stopDictation();
        };
    }, [isOpen]);

    const startDictation = async () => {
        setError(null);
        setIsListening(true);
        setTranscript(initialText);

        try {
            // 1. Start Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error("Speech recognition not supported in this browser.");
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            // Prioritize Indonesian as requested, fallback to browser default or English
            recognition.lang = 'id-ID';

            recognition.onresult = (event: any) => {
                let final = '';
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                // If we have previous partial text, we might want to append?
                // For now, simpler to just show what we hear in this session
                // or simplistic append if needed.
                if (final || interim) {
                    setTranscript(prev => {
                        // Simple logic: if 'final' comes, append it to a committed state?
                        // Actually, continuous recognition usually gives the WHOLE string if continuous=false,
                        // but distinct events if continuous=true.
                        // Let's just track the *current* session for the modal display
                        // We will combine it with initialText only on insert.
                        return (final + interim);
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech Rec Error:", event.error);
                if (event.error === 'not-allowed') {
                    setError("Microphone permission denied.");
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                // Auto-restart if still "listening" state (unless stopped manually)
                if (isListening) {
                    // recognition.start(); // Careful with infinite loops on error
                }
            };

            recognitionRef.current = recognition;
            recognition.start();

            // 2. Start Audio Visualizer (Real Audio Data)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContext();
                audioContextRef.current = audioCtx;

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256; // Defines resolution (bars)
                analyserRef.current = analyser;

                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                sourceRef.current = source;

                drawVisualizer();

            } catch (err) {
                console.warn("Visualizer init failed (maybe mic conflict?):", err);
                // Fallback: Use fake visualizer if real one fails (simulated)
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to start.");
            setIsListening(false);
        }
    };

    const stopDictation = () => {
        setIsListening(false);

        // Stop Recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        // Stop Audio Stream & Visualizer
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        cancelAnimationFrame(animationFrameRef.current);
    };

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const bars = 40; // Number of bars to draw
            const barWidth = canvas.width / bars;
            const center = canvas.height / 2;

            for (let i = 0; i < bars; i++) {
                // Pick frequencies typically found in voice range (skip very low/high)
                const index = Math.floor(i * (bufferLength / 2) / bars);
                const value = dataArray[index];

                const percent = value / 255;
                const height = percent * canvas.height * 0.8;

                // Dynamic color
                ctx.fillStyle = `rgba(${100 + (percent * 155)}, ${100}, ${255}, ${Math.max(0.3, percent)})`;

                // Rounded bar centered vertically
                const x = i * barWidth + (barWidth / 2);
                // Draw rounded rect manually or just rect
                const w = barWidth * 0.6;

                ctx.beginPath();
                ctx.roundRect(x - w / 2, center - height / 2, w, Math.max(4, height), 4);
                ctx.fill();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };
        render();
    };



    const handleDone = () => {
        stopDictation();
        onInsert(transcript);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center bg-black/60 backdrop-blur-sm p-4 pb-safe"
            >
                <motion.div
                    initial={{ y: 50, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 50, scale: 0.95 }}
                    className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                >
                    {/* Header / Visualizer Area */}
                    <div className="relative h-48 bg-gradient-to-br from-zinc-900 to-black flex flex-col items-center justify-center overflow-hidden">
                        {/* Visualizer Canvas */}
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={200}
                            className="absolute inset-0 z-10 w-full h-full opacity-80"
                        />

                        {/* Status Text */}
                        <div className="relative z-20 flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center justify-center">
                                    <Mic size={24} className="text-white" />
                                </div>
                            </div>
                            <p className="text-zinc-400 text-xs font-medium tracking-wider uppercase">
                                {isListening ? "Listening..." : "Paused"}
                            </p>
                        </div>
                    </div>

                    {/* Transcript Area */}
                    <div className="p-6 bg-white dark:bg-zinc-900 min-h-[150px] flex flex-col">
                        <div className="flex-1">
                            {transcript ? (
                                <p className="text-xl md:text-2xl font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                                    {transcript}
                                </p>
                            ) : (
                                <p className="text-xl md:text-2xl font-medium text-zinc-300 dark:text-zinc-700 leading-relaxed text-center mt-4">
                                    Speak now...
                                </p>
                            )}

                            {error && (
                                <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDone}
                                disabled={!transcript}
                                className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold shadow-lg hover:bg-black dark:hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                Done
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
