import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/ui/Header';
import ChatPanel from '../components/chat/ChatPanel';
import ChatInput from '../components/chat/ChatInput';
import AnalysisPanel from '../components/analysis/AnalysisPanel';
import ExportModal from '../components/ui/ExportModal';
import { CaseHistorySidebar } from '../components/chat/CaseHistorySidebar';
import { sendMessage } from '../lib/claudeApi';
import { parseAIResponse } from '../lib/parseAnalysis';
import { generateSummary } from '../lib/generateSummary';
import { Milestone, Sword, ShieldCheck, MapPin, AlertCircle, Globe, ChevronDown } from 'lucide-react';
import DocumentScanningOverlay from '../components/chat/DocumentScanningOverlay';

const BHASHINI_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
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

export default function ChatPage() {
  const location = useLocation();
  const [activeCaseId, setActiveCaseId] = useState(Date.now().toString());
  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('justice_ai_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      return [];
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Case State
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content:
        'SYSTEM_INITIALIZED. I am your JUSTICE_AI_STATUTORY_ANALYST. Please describe the procedural parameters of your case. Our engine will formulate a validated statutory strategy.',
      timestamp: new Date(),
    },
  ]);
  const [analysis, setAnalysis] = useState(null);

  // Settings State
  const [mode, setMode] = useState('copilot'); // 'copilot' | 'simulator'
  const [judgePersonality, setJudgePersonality] = useState('Neutral'); // 'Strict' | 'Neutral' | 'Lenient'
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('National');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [summary, setSummary] = useState('');

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'analysis' for mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate Progress
  const progress = analysis ? 100 : Math.min(Math.floor((messages.length - 1) * 25), 80);

  // 2. Handle Samples from Router State
  useEffect(() => {
    if (location.state?.sampleCase) {
      // Start new case with sample content
      const newId = Date.now().toString();
      setActiveCaseId(newId);
      const initialMsgs = [
        {
          id: '1',
          role: 'assistant',
          content: `Initializing **${location.state.caseType}** analysis. I am reviewing the provided scenario.`,
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'user',
          content: location.state.sampleCase,
          timestamp: new Date(),
        },
      ];
      setMessages(initialMsgs);
      setAnalysis(null);

      // Auto-trigger analysis for sample
      handleSampleTrigger(initialMsgs, location.state.sampleCase);
    }
  }, [location.state]);

  // 3. Handle Voice Transcription Event
  useEffect(() => {
    const handleTranscription = (event) => {
      const text = event.detail.text;
      if (text) handleSend(text);
    };

    window.addEventListener('justice-ai-transcription', handleTranscription);
    return () => window.removeEventListener('justice-ai-transcription', handleTranscription);
  }, [messages, mode, judgePersonality, selectedJurisdiction]); // Re-bind on critical state changes

  // 4. Handle Voice Query from Redirect
  useEffect(() => {
    if (location.state?.voiceQuery) {
      handleSend(location.state.voiceQuery);
      // Clear location state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 5. Save History to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('justice_ai_history', JSON.stringify(history));
  }, [history]);

  // 4. Handle System Setting Change Notification
  const initialMount = React.useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    // Only if a case is active and has messages
    if (messages.length > 1) {
      const sysMsg = {
        id: Date.now().toString(),
        role: 'system',
        content: `Configuration Updated: ${mode === 'copilot' ? 'Assistance' : 'Moot Court'} Mode • ${judgePersonality} Stance • ${selectedJurisdiction} Jurisdiction`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    }
  }, [mode, judgePersonality, selectedJurisdiction]);

  // Case Management Handlers
  const saveCurrentToHistory = () => {
    const title = messages[1]?.content?.substring(0, 40) + '...' || 'Untitled Case';
    const caseData = {
      id: activeCaseId,
      title,
      messages,
      analysis,
      timestamp: new Date(),
    };

    setHistory((prev) => {
      const filtered = prev.filter((c) => c.id !== activeCaseId);
      return [caseData, ...filtered];
    });
  };

  const loadCase = (id) => {
    const caseData = history.find((c) => c.id === id);
    if (caseData) {
      setActiveCaseId(id);
      setMessages(caseData.messages);
      setAnalysis(caseData.analysis);
    }
  };

  const handleNewCase = () => {
    // Save current before resetting if it has content
    if (messages.length > 1) {
      saveCurrentToHistory();
    }

    const newId = Date.now().toString();
    setActiveCaseId(newId);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'System reset. I am ready to assist with your next consultation. How may I help you?',
        timestamp: new Date(),
      },
    ]);
    setAnalysis(null);
  };

  const deleteCase = (id) => {
    setHistory((prev) => prev.filter((c) => c.id !== id));
    if (activeCaseId === id) {
      handleNewCase();
    }
  };

  const handleFileUpload = (file) => {
    setIsScanning(true);
  };

  const handleScanComplete = () => {
    setIsScanning(false);
    const sysMsg = {
      id: Date.now().toString(),
      role: 'system',
      content:
        '📎 **Document Processed:** Information from your uploaded document has been integrated into the case intelligence folder.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, sysMsg]);

    // Auto-trigger analysis update
    handleSend('Analyze the recently integrated document and update the strategy accordingly.');
  };

  // Helper for sample trigger
  const handleSampleTrigger = async (currentMsgs, content) => {
    setIsLoading(true);
    try {
      const aiResponseRaw = await sendMessage(currentMsgs, content, {
        judgePersonality,
        mode,
        jurisdiction: selectedJurisdiction,
        language: selectedLanguage
      });
      const { chatMessage, analysis: newAnalysis } = parseAIResponse(aiResponseRaw);
      const aiMsg = {
        id: Date.now().toString(),
        role: 'assistant',
        content: chatMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (newAnalysis) setAnalysis(newAnalysis);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (content) => {
    const userMsg = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const aiResponseRaw = await sendMessage(updatedMessages, content, {
        judgePersonality,
        mode,
        jurisdiction: selectedJurisdiction,
        language: selectedLanguage
      });
      const { chatMessage, analysis: newAnalysis } = parseAIResponse(aiResponseRaw);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatMessage,
        timestamp: new Date(),
      };

      const finaleMsgs = [...updatedMessages, aiMsg];
      setMessages(finaleMsgs);

      if (newAnalysis) {
        setAnalysis(newAnalysis);
      }

      // Auto-save to history
      const title = updatedMessages[1]?.content?.substring(0, 40) + '...' || 'Untitled Case';
      const caseData = {
        id: activeCaseId,
        title,
        messages: finaleMsgs,
        analysis: newAnalysis || analysis,
        timestamp: new Date(),
      };

      setHistory((prev) => {
        const filtered = prev.filter((c) => c.id !== activeCaseId);
        return [caseData, ...filtered];
      });
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMsg = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Error:** ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = (id) => {
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      
      // Auto-save history after deletion
      const title = filtered[1]?.content?.substring(0, 40) + '...' || 'Untitled Case';
      const caseData = {
        id: activeCaseId,
        title,
        messages: filtered,
        analysis,
        timestamp: new Date(),
      };

      setHistory((hist) => {
        const otherCases = hist.filter((c) => c.id !== activeCaseId);
        return [caseData, ...otherCases];
      });

      return filtered;
    });
  };

  const handleExport = () => {
    const textSummary = generateSummary(messages, analysis);
    setSummary(textSummary);
    setIsExportOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-void overflow-hidden font-mono text-slate-200">
      <Header onNewCase={handleNewCase} />

      <main className="flex-1 flex pt-16 h-[calc(100vh-64px)] relative">
        <DocumentScanningOverlay isOpen={isScanning} onComplete={handleScanComplete} />

        <CaseHistorySidebar
          history={history}
          currentCaseId={activeCaseId}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onSelect={loadCase}
          onNew={handleNewCase}
          onDelete={deleteCase}
        />

        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
          
          {/* Mobile Tab Switcher */}
          {isMobile && (
            <div className="flex bg-void/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-4 text-[10px] font-extrabold uppercase tracking-[0.2em] italic border-b-2 transition-all ${activeTab === 'chat' ? 'text-gold border-gold bg-gold/5 shadow-luxe' : 'text-text-tertiary border-transparent'}`}
              >
                CONSULTATION_STREAM
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex-1 py-4 text-[10px] font-extrabold uppercase tracking-[0.2em] italic border-b-2 transition-all ${activeTab === 'analysis' ? 'text-gold border-gold bg-gold/5 shadow-luxe' : 'text-text-tertiary border-transparent'}`}
              >
                STRATEGY_ANALYSIS
              </button>
            </div>
          )}

          {/* Chat Side */}
          <div 
            className={`flex-1 flex flex-col border-r border-white/5 h-full min-w-0 ${isMobile && activeTab !== 'chat' ? 'hidden' : 'flex'}`}
          >
            <div className="p-4 border-b border-white/5 bg-midnight-slate/50 flex flex-col gap-4">
              <div className="w-full bg-void border-2 border-gold/40 p-3 rounded-sm shadow-luxe flex items-center justify-center gap-3 italic">
                <AlertCircle className="w-4 h-4 text-gold shrink-0" />
                <p className="text-[9px] md:text-[10px] text-gold font-extrabold uppercase tracking-[0.2em] text-center leading-relaxed">
                  INSTITUTIONAL_NOTICE: CONSULTATIONS_ARE_INFORMATIONAL. NO_ADVOCATE_PRIVILEGE.
                </p>
              </div>

              {/* Responsive Selector Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex bg-void p-1 rounded-sm border-2 border-white/5 shadow-hard w-full">
                  <button
                    onClick={() => setMode('copilot')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-[9px] font-extrabold tracking-[0.1em] uppercase transition-all italic ${mode === 'copilot' ? 'bg-gold text-midnight shadow-luxe' : 'text-text-tertiary hover:text-white'}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ASSIST</span>
                  </button>
                  <button
                    onClick={() => setMode('simulator')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-[9px] font-extrabold tracking-[0.1em] uppercase transition-all italic ${mode === 'simulator' ? 'bg-blue-600 text-white shadow-luxe' : 'text-text-tertiary hover:text-white'}`}
                  >
                    <Sword className="w-3.5 h-3.5" />
                    <span>MOOT_LAW</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:flex items-center gap-3">
                   <div className="flex items-center gap-2 px-3 py-2 bg-void border-2 border-white/5 rounded-sm relative group">
                    <Milestone className="w-3.5 h-3.5 text-gold opacity-50" />
                    <select
                      value={judgePersonality}
                      onChange={(e) => setJudgePersonality(e.target.value)}
                      className="bg-transparent border-none p-0 text-[10px] font-extrabold text-gold uppercase tracking-widest focus:ring-0 cursor-pointer appearance-none italic w-full"
                    >
                      <option value="Strict" className="bg-void">STRICT</option>
                      <option value="Neutral" className="bg-void">NEUTRAL</option>
                      <option value="Lenient" className="bg-void">LENIENT</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-gold/30 absolute right-2 pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 bg-void border-2 border-white/5 rounded-sm relative group">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 opacity-50" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-transparent border-none p-0 text-[10px] font-extrabold text-white uppercase tracking-widest focus:ring-0 cursor-pointer appearance-none italic w-full"
                    >
                      {BHASHINI_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-void text-white">
                          {lang.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-white/20 absolute right-2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <ChatPanel messages={messages} isLoading={isLoading} onDelete={handleDeleteMessage} />
            <ChatInput onSend={handleSend} onUpload={handleFileUpload} isLoading={isLoading} />
          </div>

          {/* Analysis Side */}
          <div 
            className={`w-full md:w-[420px] lg:w-[480px] bg-midnight overflow-hidden h-full border-b md:border-b-0 border-white/5 shadow-premium ${isMobile && activeTab !== 'analysis' ? 'hidden' : 'flex'}`}
          >
            <AnalysisPanel
              analysis={analysis}
              selectedJurisdiction={selectedJurisdiction}
              isLoading={isLoading}
              onExport={handleExport}
              progress={progress}
            />
          </div>
        </div>
      </main>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} summary={summary} />
    </div>
  );
}
