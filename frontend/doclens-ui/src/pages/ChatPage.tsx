import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight, Clock, Trash2, Plus } from 'lucide-react';
import type { ChatMessage, ChatSession, CitationDto } from '../types';
import { queryChat } from '../api/client';
import { useDocuments } from '../context/DocumentContext';
import CitationCard from '../components/CitationCard';
import toast from 'react-hot-toast';

// ─── Prompt templates ─────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    category: '📋 Summarization',
    prompts: [
      'Summarize the key points of this document.',
      'What are the main conclusions and recommendations?',
      'Give me a brief executive summary.',
    ],
  },
  {
    category: '⚖️ Legal & Clauses',
    prompts: [
      'Identify any liability or indemnification clauses.',
      'What are the termination conditions?',
      'List all obligations and responsibilities of each party.',
    ],
  },
  {
    category: '📊 Facts & Data',
    prompts: [
      'Extract all numerical facts and statistics.',
      'What dates and deadlines are mentioned?',
      'List all defined terms and their definitions.',
    ],
  },
  {
    category: '🔍 Analysis',
    prompts: [
      'What risks or concerns are highlighted in this document?',
      'Compare the key concepts across sections.',
      'What assumptions are made in this document?',
    ],
  },
];

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const [showCitations, setShowCitations] = useState(false);
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : 'bg-gray-700'
        }`}
      >
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-indigo-300" />}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50'
          }`}
        >
          {msg.content}
        </div>

        {/* Meta */}
        <div className={`flex items-center gap-3 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-gray-600">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.responseTimeMs != null && (
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Clock size={10} />
              {msg.responseTimeMs}ms
            </span>
          )}
        </div>

        {/* Citations toggle */}
        {!isUser && msg.citations && msg.citations.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowCitations((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 px-1 transition-colors"
            >
              {showCitations ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
            </button>
            {showCitations && (
              <div className="mt-2 space-y-2">
                {msg.citations.map((c: CitationDto, i) => (
                  <CitationCard key={i} citation={c} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Chat Page ────────────────────────────────────────────────────────────────
const ChatPage: React.FC = () => {
  const { documents } = useDocuments();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const newSession = useCallback(() => {
    const id = crypto.randomUUID();
    setSessions((prev) => [
      ...prev,
      { id, title: 'New Chat', messages: [], createdAt: new Date() },
    ]);
    setActiveSessionId(id);
    setShowTemplates(true);
  }, []);

  useEffect(() => {
    if (sessions.length === 0) newSession();
  }, [sessions.length, newSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const updateSession = (id: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !activeSessionId) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    updateSession(activeSessionId, (s) => ({
      ...s,
      title: s.messages.length === 0 ? text.trim().slice(0, 40) : s.title,
      messages: [...s.messages, userMsg],
    }));

    setInput('');
    setLoading(true);
    setShowTemplates(false);

    try {
      const resp = await queryChat({
        question: text.trim(),
        documentId: selectedDocId || undefined,
        topK: 5,
        conversationId: activeSessionId,
      });

      if (resp.success) {
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: resp.data.answer,
          citations: resp.data.citations,
          timestamp: new Date(),
          responseTimeMs: resp.data.responseTimeMs,
        };
        updateSession(activeSessionId, (s) => ({
          ...s,
          messages: [...s.messages, aiMsg],
        }));
      }
    } catch {
      toast.error('Failed to get a response. Please try again.');
      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: s.messages.filter((m) => m.id !== userMsg.id),
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  return (
    <div className="flex h-full">
      {/* Sessions sidebar */}
      <div className="w-56 flex flex-col border-r border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sessions</span>
          <button
            onClick={newSession}
            className="text-gray-400 hover:text-indigo-400 transition-colors"
            title="New session"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setShowTemplates(s.messages.length === 0); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left group transition-colors ${
                s.id === activeSessionId ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span className="flex-1 text-xs truncate">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/40">
          <h2 className="text-sm font-semibold text-gray-200">
            {activeSession?.title ?? 'Chat'}
          </h2>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All documents</option>
            {documents.filter((d) => d.status === 'INDEXED').map((d) => (
              <option key={d.id} value={d.id}>{d.fileName}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Template prompts */}
          {showTemplates && (
            <div className="animate-fade-in">
              <p className="text-center text-gray-500 text-sm mb-6">
                Start a conversation or pick a template below
              </p>
              <div className="grid grid-cols-1 gap-4">
                {TEMPLATES.map((cat) => (
                  <div key={cat.category}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {cat.category}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {cat.prompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="text-left text-sm text-gray-300 bg-gray-800/60 hover:bg-indigo-600/20 hover:text-indigo-300 border border-gray-700/50 hover:border-indigo-500/40 px-4 py-2.5 rounded-xl transition-all duration-150"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSession?.messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <Bot size={15} className="text-indigo-300" />
              </div>
              <div className="bg-gray-800 border border-gray-700/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-1.5">
                  <Loader2 size={14} className="text-indigo-400 animate-spin" />
                  <span className="text-sm text-gray-400">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900/40">
          <div className="flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 focus-within:border-indigo-500 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none max-h-36 overflow-y-auto"
              style={{ lineHeight: '1.5rem' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 144)}px`;
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
