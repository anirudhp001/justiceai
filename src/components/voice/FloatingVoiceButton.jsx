import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Globe, X, Send, Play, Square, Loader2, Zap, AlertTriangle } from 'lucide-react';

const BHASHINI_LANGUAGES = [
  { code: 'hi', name: 'Hindi' },
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
  { code: 'ur', name: 'Urdu' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'gom', name: 'Konkani' },
  { code: 'brx', name: 'Bodo' },
  { code: 'doi', name: 'Dogri' },
  { code: 'mai', name: 'Maithili' },
  { code: 'mni', name: 'Manipuri' },
  { code: 'ne', name: 'Nepali' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'sat', name: 'Santali' },
  { code: 'bho', name: 'Bhojpuri' },
  { code: 'tcy', name: 'Tulu' },
  { code: 'raj', name: 'Rajasthani' },
  { code: 'bgc', name: 'Haryanvi' },
  { code: 'hne', name: 'Chhattisgarhi' },
  { code: 'mag', name: 'Magahi' },
  { code: 'anp', name: 'Angika' },
  { code: 'kmu', name: 'Kumaoni' },
  { code: 'gbm', name: 'Garhwali' },
  { code: 'awa', name: 'Awadhi' },
  { code: 'mwr', name: 'Marwari' },
  { code: 'mww', name: 'Mewati' },
  { code: 'mup', name: 'Malvi' },
];

// Web Speech API language codes
const WEB_SPEECH_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'ur-IN', name: 'Urdu' },
];

export default function FloatingVoiceButton({ onTranscription }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en');
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [recognitionMode, setRecognitionMode] = useState('checking'); // 'checking', 'bhashini', 'webspeech', 'mock'
  const [webSpeechSupported, setWebSpeechSupported] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setWebSpeechSupported(true);
      speechRecognitionRef.current = new SpeechRecognition();
    }
  }, []);

  // Check server config on mount
  useEffect(() => {
    const checkVoiceConfig = async () => {
      try {
        const response = await fetch('/api/voice/config');
        const data = await response.json();
        if (data.bhashini.available) {
          setRecognitionMode('bhashini');
        } else if (webSpeechSupported) {
          setRecognitionMode('webspeech');
        } else {
          setRecognitionMode('mock');
        }
      } catch (err) {
        console.error('Failed to fetch voice config:', err);
        if (webSpeechSupported) {
          setRecognitionMode('webspeech');
        } else {
          setRecognitionMode('mock');
        }
      }
    };

    if (isOpen && recognitionMode === 'checking') {
      checkVoiceConfig();
    }
  }, [isOpen, recognitionMode, webSpeechSupported]);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (speechRecognitionRef.current && recognitionMode === 'webspeech') {
      const recognition = speechRecognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Default to English

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        if (finalTranscript) {
          setTranscription(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Web Speech API Error:', event.error);
        switch (event.error) {
          case 'no-speech':
            setErrorMsg('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setErrorMsg('Microphone not accessible. Please check permissions.');
            break;
          case 'not-allowed':
            setErrorMsg('Microphone permission denied. Please allow in browser settings.');
            break;
          case 'network':
            setErrorMsg('Network error. Please check your connection.');
            break;
          default:
            setErrorMsg(`Speech error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      return () => {
        recognition.stop();
      };
    }
  }, [recognitionMode]);

  // Get language name for display
  const getLanguageName = (code) => {
    const lang = BHASHINI_LANGUAGES.find((l) => l.code === code);
    return lang?.name || code;
  };

  // Get Web Speech language code from Bhashini code
  const getWebSpeechLanguageCode = (bhashiniCode) => {
    // Map Bhashini codes to Web Speech API codes
    const mapping = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      ur: 'ur-IN',
    };
    return mapping[bhashiniCode] || 'en-US';
  };

  const startRecording = async () => {
    setErrorMsg('');
    setTranscription('');

    if (recognitionMode === 'bhashini') {
      // Use MediaRecorder + Bhashini
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        const startTime = Date.now();
        mediaRecorder.start(1000);
        setIsRecording(true);
        setTranscription('');
        setErrorMsg('');

        mediaRecorder.onstop = () => {
          const duration = Date.now() - startTime;
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          if (duration < 500) {
            setErrorMsg('Recording too short. Please record for at least 0.5 seconds.');
            return;
          }
          setAudioBlob(blob);
          processAudio(blob);
        };
      } catch (err) {
        console.error('Microphone access error:', err);
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Microphone permission denied. Please allow in browser settings.');
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No microphone found. Please connect a microphone.');
        } else if (err.name === 'NotReadableError') {
          setErrorMsg('Microphone is in use by another application.');
        } else {
          setErrorMsg('Microphone access error. Please check your settings.');
        }
      }
    } else if (recognitionMode === 'webspeech') {
      // Use Web Speech API
      try {
        const recognition = speechRecognitionRef.current;
        if (!recognition) {
          setErrorMsg('Web Speech API not available in this browser.');
          return;
        }

        // Set language based on selection
        recognition.lang = getWebSpeechLanguageCode(language);
        
        recognition.start();
        setIsRecording(true);
        setTranscription('');
        setErrorMsg('');
      } catch (err) {
        console.error('Web Speech API start error:', err);
        setErrorMsg('Failed to start speech recognition. Please try again.');
      }
    } else {
      // Mock mode
      setIsRecording(true);
      setTranscription('');
      setErrorMsg('');
      
      // Simulate recording delay
      setTimeout(() => {
        setIsRecording(false);
        setTranscription('[Mock Mode] Configure Bhashini API keys for real transcription, or use Web Speech API (Chrome/Edge).');
      }, 2000);
    }
  };

  const stopRecording = () => {
    if (recognitionMode === 'bhashini') {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      }
    } else if (recognitionMode === 'webspeech') {
      if (speechRecognitionRef.current && isRecording) {
        speechRecognitionRef.current.stop();
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
  };

  const processAudio = async (blob) => {
    if (blob.size < 500) {
      setErrorMsg('Audio too small. Please speak louder or closer to the microphone.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
      });

      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'asr',
          audioContent: base64Audio,
          sourceLanguage: language,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setTranscription(data.transcription || data.output?.[0]?.transcription || '');
    } catch (err) {
      console.error('Audio processing error:', err);
      setErrorMsg(`Processing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (transcription && onTranscription) {
      onTranscription(transcription);
      setTranscription('');
      setIsOpen(false);
    }
  };

  // Get recognition mode display info
  const getModeInfo = () => {
    switch (recognitionMode) {
      case 'bhashini':
        return { label: 'BHASHINI', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' };
      case 'webspeech':
        return { label: 'SYSTEM_SPEECH_DRIVER', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' };
      case 'mock':
        return { label: 'DEMO_BYPASS_MODE', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' };
      default:
        return { label: 'VALIDATING...', color: 'text-text-tertiary', bg: 'bg-white/5', border: 'border-white/10' };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="fixed bottom-24 md:bottom-8 right-8 z-[100] flex flex-col items-end gap-5">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="w-96 p-8 bg-void border-2 border-white/10 shadow-hard relative group overflow-hidden rounded-sm"
          >
            {/* Institutional Grid Background Overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/[0.03] rotate-45 -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Recognition Mode Badge */}
                  <div className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.3em] border rounded ${modeInfo.bg} ${modeInfo.color} ${modeInfo.border}`}>
                    {modeInfo.label}
                  </div>
                  
                  {/* Language Selector */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-void border border-white/10 rounded">
                    <Globe className="w-3.5 h-3.5 text-text-tertiary" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-transparent text-[9px] font-display font-extrabold text-white uppercase tracking-[0.15em] border-none focus:ring-0 cursor-pointer appearance-none italic"
                    >
                      {recognitionMode === 'webspeech' 
                        ? WEB_SPEECH_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code} className="bg-void text-white">
                              {lang.name.toUpperCase()}
                            </option>
                          ))
                        : BHASHINI_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code} className="bg-void text-white">
                              {lang.name.toUpperCase()}
                            </option>
                          ))
                      }
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gold/10 border-2 border-transparent hover:border-gold transition-all rounded group"
                >
                  <X className="w-5 h-5 text-text-tertiary group-hover:text-gold" />
                </button>
              </div>

              {/* Mode-specific info message */}
              {recognitionMode === 'webspeech' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded text-[9px] text-blue-300 font-bold uppercase tracking-widest">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Chrome/Edge recommended for best results</span>
                </div>
              )}

              {recognitionMode === 'mock' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[9px] text-yellow-300 font-bold uppercase tracking-widest">
                    Configure Bhashini API for real transcription
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  {isRecording && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-gold/20 rounded-full blur-xl -z-10"
                    />
                  )}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-24 h-24 rounded-sm flex items-center justify-center transition-all border-2 shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      isRecording
                        ? 'bg-gold border-gold-light/40 animate-pulse'
                        : 'bg-void border-white/10 hover:border-gold/40 group/rec'
                    }`}
                  >
                    {isRecording ? (
                      <Square className="w-10 h-10 text-midnight fill-current" />
                    ) : (
                      <Mic className="w-10 h-10 text-white group-hover/rec:text-gold transition-colors" />
                    )}
                  </button>
                </div>

                <div className="w-full min-h-[140px] p-6 bg-void border-2 border-white/5 relative group/trans">
                  <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Zap className="w-3 h-3 text-red" />
                  </div>
                  
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-gold" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-gold italic">
                          ANALYZING...
                        </span>
                      </div>
                    ) : errorMsg ? (
                      <p className="text-[11px] text-red font-extrabold uppercase tracking-widest leading-relaxed italic animate-pulse">
                         {errorMsg} 
                      </p>
                    ) : transcription ? (
                      <p className="text-sm text-white leading-relaxed font-mono font-bold italic uppercase tracking-tight">
                        "{transcription}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-text-tertiary font-extrabold uppercase tracking-[0.4em] italic opacity-60">
                        {isRecording
                          ? recognitionMode === 'webspeech' 
                            ? 'COLLECTING...' 
                            : 'RECORDING...'
                          : `PRESS MIC TO START [${getLanguageName(language).toUpperCase()}]`}
                      </p>
                    )}
                  </div>
                </div>

                {(transcription || errorMsg) && !isProcessing && (
                  <div className="flex w-full gap-4">
                    {transcription && (
                      <button
                        onClick={handleConfirm}
                        className="flex-1 py-4 bg-gold hover:bg-gold-dark text-midnight font-extrabold rounded-sm border-2 border-gold-light/20 flex items-center justify-center gap-3 transition-all shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] uppercase text-[11px] tracking-[0.3em] italic"
                      >
                        <Send className="w-4 h-4" />
                        <span>ANALYZE_VOICE_STREAM</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setTranscription('');
                        setErrorMsg('');
                      }}
                      className="px-6 py-4 bg-void border-2 border-white/10 text-text-tertiary hover:text-white hover:border-white/30 transition-all font-extrabold uppercase text-[10px] tracking-widest italic"
                    >
                      RESET
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-20 rounded-sm flex items-center justify-center shadow-hard transition-all relative overflow-hidden group border-2 ${
          isOpen
            ? 'bg-void border-gold text-gold'
            : 'bg-gold border-gold-light/30 text-midnight'
        }`}
      >
        <div className="absolute inset-0 bg-void/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <X className="w-9 h-9 relative z-10" />
        ) : (
          <Mic className="w-9 h-9 relative z-10" />
        )}
      </motion.button>
    </div>
  );
}