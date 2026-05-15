import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2, GraduationCap, X, AlertTriangle } from 'lucide-react';
import { generateCode, AIProvider } from '@/lib/ai';

interface VoiceCallProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider;
  sessionId?: string;
  onMessage?: (text: string, isAI?: boolean) => void; // Added isAI flag
  mainChatHistory?: Array<{ role: 'user' | 'ai'; content: string }>; // For conversation continuity
  onSaveToMainChat?: (messages: Array<{ role: 'user' | 'ai'; content: string }>) => void; // Save voice chat to main
}

const VoiceCall: React.FC<VoiceCallProps> = ({
  isOpen,
  onClose,
  provider,
  sessionId,
  onMessage,
  mainChatHistory = [],
  onSaveToMainChat
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');

  // Language options
  const languages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  ];

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'ai'; content: string }>>([]);

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsRequestingPermission(false);
    }
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) return;

    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      // If we have final transcript, send to AI
      if (finalTranscript.trim()) {
        handleUserSpeech(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      
      if (event.error === 'no-speech') {
        // Restart recognition if no speech detected
        if (isCalling && !isMuted) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              
            }
          }, 1000);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if call is active and not muted
      if (isCalling && !isMuted) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [isOpen, isCalling, isMuted, selectedLang]);

  // Handle user speech
  const handleUserSpeech = async (text: string) => {
    if (!text.trim() || isMuted) return;

    // Add to conversation history
    const newHistory = [...conversationHistoryRef.current, { role: 'user' as const, content: text }];
    conversationHistoryRef.current = newHistory;
    setConversationHistory(newHistory);

    // Call onMessage callback if provided (user message)
    if (onMessage) {
      onMessage(text, false);
    }

    try {
      // Generate AI response - include main chat history for context
      const combinedHistory = [
        ...mainChatHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        ...newHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ];

      const response = await generateCode(text, combinedHistory, 'tutor', provider, []);

      // Extract text from response (handle both string and MultiFileResponse)
      let responseText: string;

      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object') {
        // Handle any object response - try to extract meaningful text
        if ('content' in response && typeof response.content === 'string') {
          responseText = response.content;
        } else if ('type' in response && response.type === 'single-file' && 'content' in response) {
          responseText = String(response.content);
        } else if ('files' in response) {
          // MultiFileResponse - extract explanation or concatenate file contents
          responseText = response.files
            .map((f: any) => f.content)
            .join('\\n')
            .substring(0, 1000); // Limit for voice
        } else {
          // Last resort: try to JSON stringify and extract text
          try {
            const jsonStr = JSON.stringify(response, null, 2);
            // Try to find a content field in the JSON
            const contentMatch = jsonStr.match(/"content":\s*"([^"]+)"/);
            if (contentMatch) {
              responseText = contentMatch[1];
            } else {
              // Just use a generic response instead of showing [object Object]
              responseText = "I understand. Could you elaborate more on that?";
            }
          } catch {
            responseText = "I understand. Could you tell me more?";
          }
        }
      } else {
        responseText = "I understand. Could you tell me more?";
      }

      // Remove HTML tags and comments
      responseText = responseText
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]*`/g, '') // Remove inline code
        .trim();

      // Clean up extra whitespace and newlines
      responseText = responseText.replace(/\n\s*\n/g, ' ').replace(/\s+/g, ' ');

      // Limit length for voice (max 300 words for better UX in voice)
      const words = responseText.split(' ');
      if (words.length > 300) {
        responseText = words.slice(0, 300).join(' ') + '...';
      }

      // If response is empty or too short, use fallback
      if (!responseText || responseText.length < 10) {
        responseText = "I understand. Could you tell me more about that?";
      }

      // Add to conversation history
      const updatedHistory = [...conversationHistoryRef.current, { role: 'ai' as const, content: responseText }];
      conversationHistoryRef.current = updatedHistory;
      setConversationHistory(updatedHistory);
      setAiResponse(responseText);

      // Call onMessage callback if provided (AI response)
      if (onMessage) {
        onMessage(responseText, true);
      }

      // Clear transcript after processing
      setTranscript('');

      // Speak the response
      speakText(responseText);
    } catch (error) {
      
      speakText("I'm sorry, I encountered an error. Please try again.");
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!isSpeakerOn) return;

    // Stop any ongoing speech
    if (synthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = selectedLang;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening after speaking
      if (isCalling && !isMuted && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            
          }
        }, 500);
      }
    };

    utterance.onerror = (event) => {
      
      setIsSpeaking(false);
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start call
  const startCall = async () => {
    setError(null);
    setIsRequestingPermission(true);

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser. Please use Chrome or Edge.');
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately after getting permission (we only need permission, not the stream)
      stream.getTracks().forEach(track => track.stop());

      setIsCalling(true);
      setIsMuted(false);
      setTranscript('');
      setAiResponse('');
      conversationHistoryRef.current = [];
      setConversationHistory([]);
      setIsRequestingPermission(false);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Initial greeting
      const greeting = "Hello! I'm UseGlass Tutor. How can I help you learn today?";
      const initialHistory = [{ role: 'ai' as const, content: greeting }];
      conversationHistoryRef.current = initialHistory;
      setConversationHistory(initialHistory);
      speakText(greeting);
    } catch (error) {
      
      setIsRequestingPermission(false);

      let errorMessage = 'Failed to access microphone. ';
      const errorName = error instanceof DOMException ? error.name : (error instanceof Error && 'name' in error ? (error as { name?: string }).name : '');

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        errorMessage += 'Please allow microphone access in your browser settings.';
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone and try again.';
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        errorMessage += 'Microphone is being used by another application. Please close other apps and try again.';
      } else if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Microphone constraints could not be satisfied.';
      } else if (error instanceof Error && error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your browser permissions and try again.';
      }

      setError(errorMessage);
    }
  };

  // End call
  const endCall = () => {
    setIsCalling(false);
    setIsListening(false);
    setIsSpeaking(false);

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    // Stop speech synthesis
    window.speechSynthesis.cancel();

    // Save conversation to main chat if callback provided
    if (onSaveToMainChat && conversationHistory.length > 0) {
      onSaveToMainChat(conversationHistory);
    }

    // Reset state
    setTranscript('');
    setAiResponse('');
    conversationHistoryRef.current = [];
    setConversationHistory([]);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);

    if (!isMuted) {
      // Muting - stop recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    } else {
      // Unmuting - restart recognition
      if (isCalling && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            
          }
        }, 500);
      }
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (!isSpeakerOn) {
      // If turning speaker off, stop current speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-transparent pointer-events-none">
      <div className="pointer-events-auto relative w-full sm:max-w-2xl sm:mx-4 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-[#050505] sm:border border-white/10 sm:rounded-2xl shadow-[0_18px_60px_rgba(15,23,42,0.18)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 pt-safe">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">Voice Call with UseGlass Tutor</h3>
              <p className="text-xs text-gray-400">
                {isCalling
                  ? (isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Connected')
                  : 'Ready to start'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              disabled={isCalling}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50 max-w-[120px] sm:max-w-none"
              title="Select language"
              style={{ fontSize: '16px' }}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-[#0a0a0a] text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] p-2 rounded-lg active:bg-white/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors [touch-action:manipulation]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Call Status */}
        <div className="p-4 sm:p-6 space-y-4 flex-1">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="text-red-400 font-semibold mb-2">Microphone Access Error</h4>
                  <p className="text-sm text-red-300/80 mb-3">{error}</p>
                  <div className="text-xs text-red-300/60 space-y-1">
                    <p className="font-medium mb-2">How to fix:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Click the lock icon (🔒) in your browser's address bar</li>
                      <li>Find "Microphone" in the permissions list</li>
                      <li>Change it to "Allow"</li>
                      <li>Refresh the page and try again</li>
                    </ol>
                    <p className="mt-3 text-red-400/80">
                      <strong>Alternative:</strong> Go to browser Settings → Privacy → Site Settings → Microphone, and allow this site.
                    </p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transcript Display */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 min-h-[200px] max-h-[300px] overflow-y-auto">
            <div className="space-y-3">
              {conversationHistory.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  {isCalling
                    ? 'Start speaking... I\'m listening!'
                    : 'Click the call button to start a voice conversation'}
                </p>
              )}

              {conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${msg.role === 'user'
                    ? 'bg-purple-500/10 border border-purple-500/20 text-right'
                    : 'bg-blue-500/10 border border-blue-500/20'
                    }`}
                >
                  <p className="text-sm text-white">{msg.content}</p>
                </div>
              ))}

              {/* Current transcript (interim) */}
              {transcript && transcript.trim() && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-right">
                  <p className="text-sm text-gray-400 italic">{transcript}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-4">
            {isListening && (
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-medium">Listening</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="text-xs font-medium">AI Speaking</span>
              </div>
            )}
            {isMuted && (
              <div className="flex items-center gap-2 text-amber-400">
                <MicOff size={14} />
                <span className="text-xs font-medium">Muted</span>
              </div>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-4 sm:p-6 pb-safe border-t border-white/10 bg-gradient-to-t from-[#0a0a0a] to-transparent">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              disabled={!isCalling}
              className={`min-h-[56px] min-w-[56px] p-3.5 sm:p-4 rounded-full transition-all [touch-action:manipulation] ${isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/10 text-white border border-white/20 active:bg-white/30 hover:bg-white/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Call/End Call */}
            {!isCalling ? (
              <button
                onClick={startCall}
                disabled={isRequestingPermission}
                className="min-h-[64px] min-w-[64px] p-4 sm:p-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white active:scale-95 hover:from-green-400 hover:to-emerald-400 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed [touch-action:manipulation]"
                title="Start Call"
              >
                {isRequestingPermission ? (
                  <Loader2 size={26} className="animate-spin" />
                ) : (
                  <Phone size={26} />
                )}
              </button>
            ) : (
              <button
                onClick={endCall}
                className="min-h-[64px] min-w-[64px] p-4 sm:p-5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white active:scale-95 hover:from-red-400 hover:to-rose-400 transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 [touch-action:manipulation]"
                title="End Call"
              >
                <PhoneOff size={26} />
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={toggleSpeaker}
              disabled={!isCalling}
              className={`min-h-[56px] min-w-[56px] p-3.5 sm:p-4 rounded-full transition-all [touch-action:manipulation] ${isSpeakerOn
                ? 'bg-white/10 text-white border border-white/20 active:bg-white/30 hover:bg-white/20'
                : 'bg-white/5 text-gray-500 border border-white/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            >
              {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
          </div>

          {/* Instructions */}
          <p className="text-xs text-gray-500 text-center mt-4 px-2">
            {isCalling
              ? 'Speak naturally. I\'ll listen and respond with voice.'
              : 'Tap the green button to start a voice conversation with AI'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;
