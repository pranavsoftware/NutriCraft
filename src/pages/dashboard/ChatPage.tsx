import React, { useState, useEffect, useRef } from 'react';
import { chatApi, analyticsApi } from '../../services/features';
import { 
  Send, Sparkles, Trash2, Bot, User, 
  Info, Loader2, Flame, Activity
} from 'lucide-react';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface TodayStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Clean text & lightweight formatting component for assistant responses
 */
function FormattedMessage({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <div className="text-sm leading-relaxed">{text}</div>;
  }

  // Parse markdown into clean paragraphs and styled blocks
  const parseInline = (line: string): React.ReactNode => {
    // Clean up bold **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (listBuffer.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 text-sm text-slate-700">
            {listBuffer}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 text-sm text-slate-700">
            {listBuffer}
          </ul>
        );
      }
      listBuffer = [];
      isNumberedList = false;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    // Skip horizontal divider lines like ---
    if (/^[-*_]{3,}$/.test(line)) {
      flushList();
      elements.push(<div key={`hr-${idx}`} className="h-px bg-slate-100 my-3" />);
      return;
    }

    // Headers (# or ## or ###) -> Clean Subheadings
    if (/^#{1,6}\s+/.test(line)) {
      flushList();
      const cleanHeading = line.replace(/^#{1,6}\s+/, '');
      elements.push(
        <div key={`h-${idx}`} className="font-serif-display font-bold text-sm text-[#0B1E29] mt-3 mb-1">
          {parseInline(cleanHeading)}
        </div>
      );
      return;
    }

    // Bullet points (* or -)
    if (/^[\*\-]\s+/.test(line)) {
      if (isNumberedList) flushList();
      isNumberedList = false;
      const bulletContent = line.replace(/^[\*\-]\s+/, '');
      listBuffer.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {parseInline(bulletContent)}
        </li>
      );
      return;
    }

    // Numbered list (1. 2. etc)
    if (/^\d+\.\s+/.test(line)) {
      if (!isNumberedList) flushList();
      isNumberedList = true;
      const numContent = line.replace(/^\d+\.\s+/, '');
      listBuffer.push(
        <li key={`nli-${idx}`} className="leading-relaxed">
          {parseInline(numContent)}
        </li>
      );
      return;
    }

    // Empty lines
    if (!line) {
      flushList();
      elements.push(<div key={`sp-${idx}`} className="h-1.5" />);
      return;
    }

    // Standard paragraph line
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="text-sm text-slate-700 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadChatData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadChatData = async () => {
    try {
      setInitialLoading(true);
      const [historyRes, todayRes] = await Promise.all([
        chatApi.getHistory(),
        analyticsApi.getToday(),
      ]);

      if (historyRes.data.success && historyRes.data.messages?.length > 0) {
        setMessages(historyRes.data.messages);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: "Hello! 🌿 I'm NutriCraft AI, your personal dietitian assistant. I can analyze your meals, recommend recipes matching your macro targets, or suggest dietary improvements. How can I help you today?",
          },
        ]);
      }

      if (todayRes.data.success) {
        setTodayStats(todayRes.data.consumed);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(userText);
      if (res.data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I had trouble generating a response. Please verify your connection or try asking again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear your chat history?')) return;
    try {
      await chatApi.clearHistory();
      setMessages([
        {
          role: 'assistant',
          content: 'Chat history cleared. How can I assist with your nutrition goals today?',
        },
      ]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const quickPrompts = [
    "How are my macros looking today?",
    "Suggest a high-protein dinner under 500 kcal",
    "What snacks will help me hit my protein target?",
    "Tips to reduce afternoon cravings",
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      {/* Header & Context Pill */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-serif-display text-xl font-bold text-[#0B1E29]">AI Nutrition Assistant</h1>
            <p className="text-xs text-slate-400">Context-aware dietary guidance & meal coaching</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {todayStats && (
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Flame size={13} className="text-amber-500" /> {todayStats.calories} kcal
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Activity size={13} className="text-blue-500" /> {todayStats.protein}g protein
              </span>
            </div>
          )}

          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {initialLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={32} className="text-green-600 animate-spin" />
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className={`chat-bubble ${msg.role}`}>
                    <FormattedMessage text={msg.content} isUser={isUser} />
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#0B1E29] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} />
                </div>
                <div className="chat-bubble assistant flex items-center gap-1.5 py-3">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInputMessage(prompt)}
            className="text-xs bg-white hover:bg-green-50 border border-slate-200 hover:border-green-300 text-slate-600 hover:text-green-700 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask NutriCraft AI about your diet, recipes, or daily macros..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm text-slate-800 outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Send size={15} />
          <span className="hidden sm:inline text-xs">Send</span>
        </button>
      </form>

      <div className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
        <Info size={11} />
        <span>NutriCraft AI provides dietary coaching. Consult healthcare professionals for medical conditions.</span>
      </div>
    </div>
  );
}
