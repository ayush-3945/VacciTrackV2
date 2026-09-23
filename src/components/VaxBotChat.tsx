import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, ShieldCheck, HelpCircle, Volume2, VolumeX, RotateCcw, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  actionType?: 'certificate' | 'schedule';
}

export const ENGLISH_QUESTIONS = [
  "What to do if baby gets fever after vaccine?",
  "What if no BCG scar has formed after 12 weeks?",
  "Can I bathe my baby immediately after vaccination?",
  "What if we missed a scheduled vaccine dose?",
  "What is Pentavalent vaccine and why is it given?",
  "How to download official QR-verified certificate?",
  "What is the difference between OPV and IPV polio vaccines?",
  "How to relieve injection site swelling and pain?",
  "What is ABHA ID and why is it needed?",
  "Overview of India's NIS 2025 vaccine schedule",
];

export const HINGLISH_QUESTIONS = [
  "Vaccine ke baad baby ko bukhar aa gaya, kya karein?",
  "BCG scar nahi bana toh kya dobara lagwana padega?",
  "Vaccine lagne ke baad baby ko nehla sakte hain kya?",
  "Agar dose miss ho gayi ya date nikal gayi toh kya karein?",
  "Pentavalent vaccine 5 bimariyon se kaise bachati hai?",
  "Official QR wala Vaccine Certificate kaise download karein?",
  "OPV do boond aur IPV sui me kya antar hai?",
  "Injection wali jagah par sujan aur dard ka kya ilaj hai?",
  "Bachhe ka ABHA ID kya hota hai aur iska kya fayda hai?",
  "India ke NIS 2025 schedule me kaun-kaun si vaccines hain?",
];

const VaxBotChat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState<'hinglish' | 'english'>('hinglish');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const getWelcomeText = (name?: string) =>
    name
      ? `Namaste ${name}! 👋 Main **VaxBot** hoon — aapka AI Pediatric & NIS 2025 Vaccine Guide.\n\nAapke bache ke vaccine updates, fever care, missed doses, ya certificate ke bare me kuch bhi puchein!`
      : `Namaste! 👋 Main **VaxBot** hoon — aapka AI Pediatric & NIS 2025 Vaccine Guide.\n\nAap mujhse vaccine ke side effects, fever care, missed doses, ya immunization schedule ke bare me English, Hindi ya Hinglish me puch sakte hain!`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: getWelcomeText(user?.name),
      timestamp: new Date(),
    },
  ]);

  // Synchronize welcome message when user authentication loads
  useEffect(() => {
    if (user?.name) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].id === 'welcome') {
          return [
            {
              id: 'welcome',
              sender: 'bot',
              text: getWelcomeText(user.name),
              timestamp: prev[0].timestamp,
            },
          ];
        }
        return prev;
      });
    }
  }, [user?.name]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
      }
    }
  }, [isOpen, messages, isTyping]);

  // Pre-load synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const isHinglishText = (txt: string) => {
    const hinglishKeywords = [
      'kya', 'karein', 'kare', 'kaise', 'hai', 'hain', 'nahi', 'na', 'bhi', 'toh',
      'baby ko', 'bache', 'bachhe', 'lagwana', 'padega', 'nehla', 'sakte', 'chhut',
      'antar', 'sujan', 'dard', 'ilaj', 'fayda', 'kaun', 'bukhar', 'doodh', 'dawa',
      'nishan', 'boond', 'sui', 'chahiye', 'shuru', 'jankari', 'namaste', 'gharelu',
      'upay', 'sooti', 'stanpan', 'gungune', 'khansi', 'jaanleva'
    ];
    const lower = txt.toLowerCase();
    return hinglishKeywords.some(kw => lower.includes(kw));
  };

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`•\-]/g, '');
    const isHinglish = isHinglishText(cleanText) || activePromptTab === 'hinglish';
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Get all available system & browser voices
    const voices = window.speechSynthesis.getVoices();

    if (isHinglish) {
      utterance.lang = 'hi-IN';
      // Look for Hindi (hi-IN) voice first, or Indian English (en-IN)
      const indianVoice =
        voices.find(v => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase().startsWith('hi')) ||
        voices.find(v => v.lang.toLowerCase() === 'en-in') ||
        voices.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('india'));

      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
    } else {
      utterance.lang = 'en-IN';
      const englishVoice =
        voices.find(v => v.lang.toLowerCase() === 'en-in') ||
        voices.find(v => v.name.toLowerCase().includes('india')) ||
        voices.find(v => v.lang.toLowerCase().startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.rate = 0.95;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetChat = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: getWelcomeText(user?.name),
        timestamp: new Date(),
      },
    ]);
  };

  const detectAction = (text: string): 'certificate' | 'schedule' | undefined => {
    const lower = text.toLowerCase();
    if (lower.includes('certificate') || lower.includes('pdf') || lower.includes('praman patra')) {
      return 'certificate';
    }
    if (lower.includes('schedule') || lower.includes('dates') || lower.includes('due date')) {
      return 'schedule';
    }
    return undefined;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await chatAPI.ask(text, {
        userName: user?.name,
        userRole: user?.role,
        lang: activePromptTab,
      });
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        timestamp: new Date(),
        suggestions: res.suggestions && res.suggestions.length > 0 ? res.suggestions : undefined,
        actionType: detectAction(res.reply),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (err: any) {
      console.error(err);
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Maaf kijiye, server se connect karne me dikkat aa rahi hai. Vaccine ke baad halka bukhar aana normal hai. Baby ko comfortable kapde pehnayein aur lukewarm paani ki patti rakhein.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={cn('min-h-[1.25rem]', idx > 0 && 'mt-1')}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  const currentQuestions = activePromptTab === 'hinglish' ? HINGLISH_QUESTIONS : ENGLISH_QUESTIONS;

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 text-white shadow-xl hover:shadow-teal-500/25 transition-all duration-300 border border-teal-400/30 group"
            aria-label="Open VaxBot AI Assistant"
          >
            <div className="relative">
              <Bot className="w-6 h-6 animate-bounce" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-teal-600" />
            </div>
            <span className="font-display font-semibold text-sm pr-1 hidden sm:inline-block">
              {isOpen ? 'Close VaxBot' : 'Ask VaxBot AI'}
            </span>
          </button>
        </motion.div>
      </div>

      {/* Chat Window Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[440px] h-[600px] max-h-[85vh] bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-4 flex items-center justify-between shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-emerald-200">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-display text-base text-white">VaxBot</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> AI Online
                    </span>
                  </div>
                  <p className="text-xs text-teal-100">NIS 2025 Pediatric Immunization Guide</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                  title="Clear / Reset Conversation"
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick 10+10 Question Tabs Tray (Clean scroll without ugly arrows) */}
            <div className="p-2.5 bg-muted/40 border-b border-border/60 flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" /> Popular Questions (10+10)
                </span>
                <div className="flex gap-1 bg-background p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => setActivePromptTab('hinglish')}
                    className={cn(
                      'px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors',
                      activePromptTab === 'hinglish'
                        ? 'bg-teal-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    🇮🇳 Hinglish (10)
                  </button>
                  <button
                    onClick={() => setActivePromptTab('english')}
                    className={cn(
                      'px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors',
                      activePromptTab === 'english'
                        ? 'bg-teal-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    🌐 English (10)
                  </button>
                </div>
              </div>

              {/* Seamless horizontal questions scroll */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {currentQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap font-medium bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 border border-teal-500/20 transition-all text-left flex-shrink-0"
                  >
                    {idx + 1}. {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col',
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-start gap-2 max-w-[88%]">
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-teal-500/20">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs relative group',
                        msg.sender === 'user'
                          ? 'bg-teal-600 text-white rounded-tr-xs'
                          : 'bg-muted/70 text-foreground border border-border/70 rounded-tl-xs'
                      )}
                    >
                      {renderFormattedText(msg.text)}

                      {/* Quick Action Shortcuts for Certificate or Schedule */}
                      {msg.sender === 'bot' && msg.actionType === 'certificate' && (
                        <div className="mt-3 pt-2 border-t border-border/60">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> Open Certificate Dashboard
                          </button>
                        </div>
                      )}

                      {msg.sender === 'bot' && msg.actionType === 'schedule' && (
                        <div className="mt-3 pt-2 border-t border-border/60">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" /> View Immunization Schedule
                          </button>
                        </div>
                      )}

                      {/* Welcome message quick shortcuts */}
                      {msg.sender === 'bot' && msg.id === 'welcome' && (
                        <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-medium hover:bg-teal-600 hover:text-white transition-all shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> Download Certificate
                          </button>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-medium hover:bg-teal-600 hover:text-white transition-all shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Full Schedule
                          </button>
                        </div>
                      )}

                      {/* Voice Speak Button on ALL Bot messages */}
                      {msg.sender === 'bot' && (
                        <button
                          onClick={() => handleSpeak(msg.text, msg.id)}
                          className="mt-2 text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/80 border border-border/70 transition-colors"
                          title="Listen to this response"
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3 text-rose-500 animate-pulse" />
                              <span className="text-rose-500 font-semibold">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-primary" />
                              <span className="font-medium">Listen (Suniye) 🔊</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-9">
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(suggestion)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 border border-teal-500/20 transition-all text-left"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs pl-2">
                  <div className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1 bg-muted p-2 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-card/80 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask in Hindi, English ya Hinglish..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                  className="rounded-xl px-3 bg-teal-600 hover:bg-teal-700 text-white h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-[10px] text-center text-muted-foreground/70 mt-1.5 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>NIS 2025 Clinical AI Guide • In emergency consult pediatrician</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VaxBotChat;
