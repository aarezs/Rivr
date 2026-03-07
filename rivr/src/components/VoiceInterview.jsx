import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, MessageSquare, User, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import Waveform from './ui/Waveform';
import { ELEVENLABS_AGENT_ID, getElevenLabsLanguage, buildTranscript, getMockTranscript } from '../services/elevenlabs';

export default function VoiceInterview({ language, onComplete }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState('intro'); // intro, active, complete, error
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const completedRef = useRef(false);

  // Keep a ref in sync so the disconnect callback reads latest messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((type, text) => {
    if (!text || !text.trim()) return;
    setMessages(prev => [...prev, { type, text: text.trim() }]);
  }, []);

  // Guard against double-calling onComplete (endSession + onDisconnect race)
  const finishInterview = useCallback((transcript) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete(transcript);
  }, [onComplete]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[ElevenLabs] Connected');
      setPhase('active');
      setError(null);
    },
    onDisconnect: () => {
      console.log('[ElevenLabs] Disconnected');
      // Agent ended the conversation — auto-advance
      if (messagesRef.current.length > 0) {
        const transcript = buildTranscript(messagesRef.current);
        finishInterview(transcript);
      }
    },
    onMessage: (message) => {
      console.log('[ElevenLabs] Message:', message);
      if (message.source === 'ai') {
        addMessage('ai', message.message);
      } else if (message.source === 'user') {
        addMessage('user', message.message);
      }
    },
    onError: (err) => {
      console.error('[ElevenLabs] Error:', err);
      setError('Connection error. You can retry or continue with a demo interview.');
      if (phase === 'intro') setPhase('error');
    },
  });

  const startInterview = async () => {
    try {
      setError(null);
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        connectionType: 'webrtc',
        overrides: {
          agent: {
            language: getElevenLabsLanguage(language),
          },
        },
      });
    } catch (err) {
      console.error('[ElevenLabs] Start failed:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow mic access and try again.');
      } else {
        setError('Could not connect to voice AI. You can retry or continue with a demo interview.');
      }
      setPhase('error');
    }
  };

  const endInterview = async () => {
    const transcript = messages.length > 0
      ? buildTranscript(messages)
      : getMockTranscript();
    try {
      await conversation.endSession();
    } catch {
      // Session may already be ended
    }
    finishInterview(transcript);
  };

  const handleDemoFallback = () => {
    finishInterview(getMockTranscript());
  };

  const isAgentSpeaking = conversation.isSpeaking;
  const isConnected = conversation.status === 'connected';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4 relative z-10 shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-primary text-sm font-medium">{t('interview.title')}</span>
        </div>
        <p className="text-text-light text-sm">{t('interview.subtitle')}</p>
      </div>

      {phase === 'intro' ? (
        /* Intro screen */
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-sm animate-fade-in-up">
            <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse-ring">
              <Mic className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{t('interview.title')}</h3>
            <p className="text-text-light text-sm mb-8">
              Our AI assistant will ask you a few questions about your symptoms. Speak clearly and the AI will guide you through the process.
            </p>
            <button
              onClick={startInterview}
              className="px-8 py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold
                transition-all duration-300 shadow-lg shadow-primary/20 cursor-pointer"
            >
              {t('interview.startSpeaking')}
            </button>
          </div>
        </div>
      ) : phase === 'error' ? (
        /* Error screen */
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-sm animate-fade-in-up">
            <div className="w-24 h-24 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-danger" />
            </div>
            <p className="text-white/80 text-sm mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setPhase('intro'); setError(null); }}
                className="px-8 py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold
                  transition-all duration-300 shadow-lg shadow-primary/20 cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={handleDemoFallback}
                className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium
                  transition-all duration-300 border border-white/10 cursor-pointer"
              >
                Continue with Demo Data
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-fade-in ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${msg.type === 'ai' ? 'bg-primary/15' : 'bg-accent/15'}`}
                >
                  {msg.type === 'ai'
                    ? <Bot className="w-4 h-4 text-primary" />
                    : <User className="w-4 h-4 text-accent" />
                  }
                </div>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-lg
                  ${msg.type === 'ai'
                    ? 'glass text-white/90 rounded-tl-sm'
                    : 'glass-light border border-white/5 text-white/90 rounded-tr-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Waveform + controls */}
          <div className="shrink-0 border-t border-white/5 bg-dark-bg-lighter/50">
            {/* Waveform */}
            <div className="px-4 pt-3">
              <Waveform state={isAgentSpeaking ? 'speaking' : isConnected ? 'listening' : 'idle'} />
            </div>

            {/* Status label */}
            <div className="text-center py-2">
              <span className="text-xs text-text-light font-medium">
                {isAgentSpeaking
                  ? t('interview.speaking')
                  : isConnected
                    ? t('interview.listening')
                    : 'Connecting...'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-6 flex justify-center gap-3">
              {/* Mic indicator (visual only — mic is always on via WebRTC) */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                  ${isAgentSpeaking
                    ? 'bg-dark-bg-lighter opacity-50 border border-white/5'
                    : isConnected
                      ? 'bg-primary/20 border border-primary/30 shadow-lg shadow-primary/20 animate-glow-pulse'
                      : 'bg-dark-bg-lighter opacity-50 border border-white/5'
                  }`}
              >
                {isAgentSpeaking
                  ? <MicOff className="w-7 h-7 text-white" />
                  : <Mic className="w-7 h-7 text-white" />
                }
              </div>
              {/* End interview button */}
              {isConnected && messages.length >= 2 && (
                <button
                  onClick={endInterview}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium
                    transition-all duration-300 border border-white/10 cursor-pointer self-center"
                >
                  End Interview
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
