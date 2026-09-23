import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, ShieldCheck, Languages, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestions?: string[];
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
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState<'hinglish' | 'english'>('hinglish');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Namaste! 👋 Main **VaxBot** hoon — aapka AI Pediatric & NIS 2025 Vaccine Guide.\n\nAap mujhse vaccine ke side effects, fever care, missed doses, ya immunization schedule ke bare me English, Hindi ya Hinglish me puch sakte hain!\n\n👇 **Neeche diye gaye 10 Hinglish ya 10 English questions me se koi bhi click karein:**',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

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
      const res = await chatAPI.ask(text);
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        timestamp: new Date(),
        suggestions: res.suggestions && res.suggestions.length > 0 ? res.suggestions : undefined,
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
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[440px] h-[590px] max-h-[85vh] bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl z-50 flex flex-col overflow-hidden"
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
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick 10+10 Question Tabs Tray */}
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

              {/* Horizontal Scroll of Questions */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
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
                        'p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs',
                        msg.sender === 'user'
                          ? 'bg-teal-600 text-white rounded-tr-xs'
                          : 'bg-muted/70 text-foreground border border-border/70 rounded-tl-xs'
                      )}
                    >
                      {renderFormattedText(msg.text)}
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
