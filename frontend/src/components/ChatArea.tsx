import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, SendHorizontal, Compass, Sparkles } from 'lucide-react';
import type { Message } from '../types';
import { FlightCard } from './FlightCard';
import { HotelCard } from './HotelCard';
import { ItineraryTimeline } from './ItineraryTimeline';
import { PremiumSummary } from './PremiumSummary';

interface ChatAreaProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (val: string) => void;
  onSendMessage: () => void;
  onSelectTemplate: (text: string) => void;
}

const TEMPLATES = [
  { text: "Plan a 3-day weekend trip to Tokyo, Japan 🌸", label: "Tokyo, Japan" },
  { text: "Create a cultural itinerary for Rome, Italy 🏛️", label: "Rome, Italy" },
  { text: "Search flights and hotels for a family trip to Paris, France 🗼", label: "Paris, France" },
  { text: "Help me pack for a hiking trip to the Swiss Alps 🏔️", label: "Swiss Alps" }
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  inputValue,
  setInputValue,
  onSendMessage,
  onSelectTemplate,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputValueRef = useRef(inputValue);

  // Keep ref up to date
  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentVal = inputValueRef.current;
        const space = currentVal.trim() ? ' ' : '';
        setInputValue(currentVal + space + transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [setInputValue]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Google Chrome or Apple Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc]/40 dark:bg-[#0b0f19]/20 relative overflow-hidden">
      {/* Scrollable Chat History */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 select-none">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center text-center px-4 space-y-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-xl shadow-brand-500/20 mx-auto">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-outfit text-slate-800 dark:text-white">
                Where to next, <span className="text-gradient">Explorer</span>?
              </h1>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
                TravelPilot AI compiles details using specialized agents for flights, hotels, and custom travel routing.
              </p>
            </motion.div>

            {/* Prompt Template Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-4">
              {TEMPLATES.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectTemplate(item.text)}
                  className="p-4 bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/40 dark:border-slate-800/30 rounded-2xl text-left cursor-pointer transition-all duration-200 shadow-sm"
                >
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block mb-1">
                    {item.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Streams */
          <div className="max-w-4xl mx-auto space-y-8 pb-10">
            {messages.map((message) => {
              const isAI = message.sender === 'ai';
              return (
                <div
                  key={message.id}
                  className={`flex ${isAI ? 'justify-start' : 'justify-end'} w-full`}
                >
                  <div
                    className={`max-w-[85%] flex flex-col space-y-2 ${
                      isAI ? 'items-start' : 'items-end'
                    }`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`py-3.5 px-5 rounded-2xl text-sm leading-relaxed ${
                        isAI
                          ? 'bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/30 text-slate-700 dark:text-slate-200 shadow-sm rounded-tl-none'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-medium shadow-sm rounded-tr-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>

                    {/* Timestamp label */}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
                      {message.timestamp}
                    </span>

                    {/* Flight Results Card */}
                    {message.flights && message.flights.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-3 pt-3"
                      >
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                          <Compass className="w-3.5 h-3.5 text-brand-500" />
                          <span>Flight Agent Picks</span>
                        </div>
                        {message.flights.map((flight) => (
                          <FlightCard key={flight.id} flight={flight} />
                        ))}
                      </motion.div>
                    )}

                    {/* Hotel Results Card */}
                    {message.hotels && message.hotels.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-3 pt-4"
                      >
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                          <Compass className="w-3.5 h-3.5 text-teal-500" />
                          <span>Hotel Agent Picks</span>
                        </div>
                        <HotelCard hotels={message.hotels} />
                      </motion.div>
                    )}

                    {/* Itinerary Timeline */}
                    {message.itinerary && message.itinerary.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-3 pt-4"
                      >
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                          <Compass className="w-3.5 h-3.5 text-orange-500" />
                          <span>Curated Travel Itinerary</span>
                        </div>
                        <ItineraryTimeline days={message.itinerary} />
                      </motion.div>
                    )}

                    {/* Final Premium Summary Card */}
                    {message.summary && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full pt-4"
                      >
                        <PremiumSummary summary={message.summary} />
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Custom Streaming Typing Indicator */}
            {messages.length > 0 && messages[messages.length - 1].isStreaming && (
              <div className="flex justify-start w-full">
                <div className="max-w-[85%] flex items-center space-x-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/30 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                    Orchestrator running agents...
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Form Area */}
      <div className="p-6 bg-gradient-to-t from-white dark:from-[#090d16] via-white/80 dark:via-[#090d16]/80 to-transparent border-t border-slate-200/40 dark:border-slate-800/20">
        <div className="max-w-4xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-lg rounded-2xl p-2 focus-within:border-brand-500/50 transition-colors">
          
          {/* Prompt input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isListening ? "Listening... Speak clearly" : "Where would you like to travel?"}
            className="flex-1 bg-transparent border-none text-sm pl-4 pr-3 focus:outline-none text-slate-800 dark:text-white placeholder-slate-400"
          />

          {/* Voice Input (Active indicator shows Red) */}
          <button
            onClick={handleMicClick}
            className={`p-3 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
              isListening
                ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 ring-4 ring-rose-500/10'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Mic className="w-4.5 h-4.5" />
              </motion.div>
            ) : (
              <Mic className="w-4.5 h-4.5" />
            )}
          </button>

          {/* Send Action */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSendMessage}
            disabled={!inputValue.trim()}
            className={`p-3 rounded-xl flex items-center justify-center font-bold text-xs transition-colors outline-none ${
              inputValue.trim()
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <SendHorizontal className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
