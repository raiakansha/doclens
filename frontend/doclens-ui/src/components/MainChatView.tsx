import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  RotateCcw,
  Zap,
} from 'lucide-react';
import type { ChatMessage, CitationDto, DocumentResponse } from '../types';
import CitationCard from './CitationCard';
import { MarkdownContent } from './MarkdownContent';
import toast from 'react-hot-toast';

interface MainChatViewProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  selectedDocId: string;
  documents: DocumentResponse[];
  streamTokens: boolean;
  onToggleStreamTokens: (val: boolean) => void;
  onTriggerUpload?: () => void;
}

const TEMPLATES = [
  {
    icon: '📄',
    title: 'Summarize Key Points',
    description: 'Summarize the key points and executive highlights of this document.',
    prompt: 'Summarize the key points and executive highlights of this document.',
  },
  {
    icon: '❓',
    title: 'Interview / Q&A Insights',
    description: 'What are the most critical questions and answers covered in this text?',
    prompt: 'What are the most critical questions and answers covered in this text?',
  },
  {
    icon: '📝',
    title: 'Action Items & Deadlines',
    description: 'List all actionable takeaways, deadlines, and responsibilities mentioned.',
    prompt: 'List all actionable takeaways, deadlines, and responsibilities mentioned.',
  },
  {
    icon: '🔍',
    title: 'Technical Concepts',
    description: 'Explain the main technical concepts and architecture described in this document.',
    prompt: 'Explain the main technical concepts and architecture described in this document.',
  },
];

const MessageBubble: React.FC<{ msg: ChatMessage; isStreaming?: boolean }> = ({
  msg,
  isStreaming,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const isUser = msg.role === 'user';

  const copyText = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 animate-fade-in select-none">
        <div className="bg-[#0078ff] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-medium leading-relaxed max-w-[70%] shadow-lg shadow-blue-500/10">
          {msg.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-[#1b253b] text-slate-300 flex items-center justify-center shrink-0 border border-[#242e47]">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in select-none">
      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-[80%]">
        <div className="relative bg-[#111726] border border-[#1f2942] rounded-2xl rounded-tl-sm p-4 text-sm text-slate-100 leading-relaxed shadow-lg">
          <MarkdownContent content={msg.content} />
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
          )}

          {/* Copy Button at bottom right */}
          <div className="flex justify-end pt-3 mt-2 border-t border-[#1b253b]/50 text-slate-400">
            <button
              onClick={copyText}
              className="p-1 rounded hover:bg-[#1b253b] hover:text-slate-200 transition-colors"
              title="Copy response"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Citations toggle */}
        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-2 pl-1">
            <button
              onClick={() => setShowCitations((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              {showCitations ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>
                {msg.citations.length} grounded source citation{msg.citations.length > 1 ? 's' : ''}
              </span>
            </button>
            {showCitations && (
              <div className="mt-2 space-y-2">
                {msg.citations.map((c: CitationDto, i: number) => (
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

const MainChatView: React.FC<MainChatViewProps> = ({
  messages,
  loading,
  onSendMessage,
  onClearChat,
  selectedDocId,
  documents,
  streamTokens,
  onToggleStreamTokens,
  onTriggerUpload,
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const contextLabel = selectedDoc
    ? selectedDoc.fileName
    : 'All Uploaded Documents';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070a11] overflow-hidden select-none">
      {/* Top Context Bar */}
      <div className="h-10 bg-[#090d17] border-b border-[#1b2437] px-4 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 font-medium">Context:</span>
          <span className="font-semibold text-white">{contextLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={streamTokens}
                onChange={(e) => onToggleStreamTokens(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-6 h-3.5 bg-[#1b2437] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <span className="text-slate-400 text-[11px]">Stream Tokens</span>
          </div>

          {onTriggerUpload && (
            <button
              onClick={onTriggerUpload}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-md text-[11px] font-medium transition-colors cursor-pointer shadow-sm"
              title="Upload new documents"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}

          <button
            onClick={onClearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Chat Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Welcome / Template Landing Page (Screenshot 1) */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center animate-fade-in">
            {/* Center Blue Sparkle Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 border border-blue-500/30">
              <Sparkles className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              DocLens AI Document Assistant
            </h2>
            <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
              Upload PDF reports, Word files, or notes and chat naturally with
              grounded facts, source citations, and page numbers.
            </p>

            {/* 2x2 Feature Templates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  onClick={() => onSendMessage(tpl.prompt)}
                  className="p-4 bg-[#0e1422] hover:bg-[#121a2d] border border-[#1e2638] hover:border-blue-500/40 rounded-2xl transition-all group duration-200"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{tpl.icon}</span>
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {tpl.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg, index) => {
          if (msg.role === 'assistant' && !msg.content.trim()) {
            return null;
          }
          const isLatestAssistant =
            loading &&
            msg.role === 'assistant' &&
            index === messages.length - 1;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isStreaming={isLatestAssistant}
            />
          );
        })}

        {/* Thinking Indicator */}
        {loading &&
          (messages.length === 0 ||
            messages[messages.length - 1].role === 'user' ||
            !messages[messages.length - 1].content) && (
            <div className="flex gap-3 animate-fade-in select-none">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#111726] border border-[#1f2942] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Synthesizing document answer...</span>
              </div>
            </div>
          )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-[#1b2437] bg-[#090d17]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-[#0e1422] border border-[#1f2942] focus-within:border-blue-500/70 rounded-2xl p-3 shadow-xl transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDoc
                  ? `Ask a question about ${selectedDoc.fileName}...`
                  : 'Ask a question across all documents...'
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-32 overflow-y-auto"
              style={{ lineHeight: '1.5rem' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
              }}
            />

            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-500 select-none">
            <span>
              Press <kbd className="px-1 bg-[#161e31] rounded text-slate-400">Enter</kbd> to send,{' '}
              <kbd className="px-1 bg-[#161e31] rounded text-slate-400">Shift+Enter</kbd> for newline
            </span>
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <Zap className="w-3 h-3" /> Grounded RAG
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChatView;
