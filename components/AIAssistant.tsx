import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { RocketConfig, SimulationState } from '../types';
import { getDesignAdvice } from '../services/geminiService';

interface AIAssistantProps {
  config: RocketConfig;
  lastMissionAnalysis: string | null;
  isSimulating: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ config, lastMissionAnalysis, isSimulating }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Welcome to Mission Control. Configure your rocket parameters and launch. I'll analyze your flight data." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-add mission analysis when available
  useEffect(() => {
    if (lastMissionAnalysis) {
      setMessages(prev => [...prev, { role: 'ai', text: lastMissionAnalysis }]);
    }
  }, [lastMissionAnalysis]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const advice = await getDesignAdvice(config, userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: advice }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI mainframe." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl flex flex-col h-[300px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
        <Bot className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-slate-200 text-sm tracking-wider uppercase">Gemini Mission Co-Pilot</h3>
        {isSimulating && <span className="ml-auto text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded animate-pulse">MONITORING</span>}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30' 
                : 'bg-slate-700/50 text-slate-200 border border-slate-600'
            }`}>
              {msg.role === 'ai' && <Sparkles className="w-3 h-3 inline mr-2 text-yellow-400" />}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-700/30 p-2 rounded-lg text-xs text-slate-400 flex items-center gap-1">
               <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
               <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
               <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-900/50 border-t border-slate-700 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about rocket physics..."
          className="flex-1 bg-slate-800 text-slate-200 text-sm rounded border border-slate-700 px-3 py-2 focus:outline-none focus:border-purple-500"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;