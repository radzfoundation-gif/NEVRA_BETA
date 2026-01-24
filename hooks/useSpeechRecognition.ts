import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    hasRecognitionSupport: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize SpeechRecognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Keep listening until stopped
            recognitionRef.current.interimResults = true; // Show results as you speak
            recognitionRef.current.lang = 'en-US'; // Default to English (can be parameterized later)

            recognitionRef.current.onstart = () => {
                setIsListening(true);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';

                // Iterate through results
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        // Can handle interim results here if needed for real-time preview
                        // For now, we mainly care about accumulating the transcript
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(finalTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                // Reset transcript on new session or append?
                // Usually append is better UX for "pause and continue"
                // But here we might want to clear previous if handled outside
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start recognition:", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        hasRecognitionSupport: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    };
};
