import React from 'react';
import { Search, ExternalLink, Sun, Moon, Layers } from 'lucide-react';
import type { DocumentResponse } from '../types';

interface HeaderProps {
  documents: DocumentResponse[];
  selectedDocId: string;
  onSelectDoc: (id: string) => void;
  onOpenSearchModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
  documents,
  selectedDocId,
  onSelectDoc,
  onOpenSearchModal,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-14 bg-[#0b0f19] border-b border-[#1b2437] px-4 flex items-center justify-between shrink-0 select-none">
      {/* Left Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#0078ff] flex items-center justify-center shadow-md shadow-blue-500/20">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">DocLens</h1>
            <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
              AI RAG
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Spring AI • PostgreSQL pgvector • Google Gemini</p>
        </div>
      </div>

      {/* Center Scope Selector Pill */}
      <div className="hidden md:flex items-center gap-2 bg-[#121827] border border-[#1b2437] rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs text-slate-400 font-medium">Scope:</span>
        <select
          value={selectedDocId}
          onChange={(e) => onSelectDoc(e.target.value)}
          className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
        >
          <option value="" className="bg-[#0b0f19] text-white">
            All Documents ({documents.length})
          </option>
          {documents.map((d, idx) => (
            <option key={d?.id || `doc-${idx}`} value={d?.id || ''} className="bg-[#0b0f19] text-white">
              {d?.fileName || 'Untitled Document'}
            </option>
          ))}
        </select>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search Chunks Button (⌘K) */}
        <button
          onClick={onOpenSearchModal}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#121827] hover:bg-[#182035] border border-[#1b2437] hover:border-[#2d3a54] rounded-lg text-xs font-medium text-slate-300 transition-all cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span>Search Chunks</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-[#1b2437] rounded">
            ⌘ K
          </kbd>
        </button>

        {/* Swagger Link */}
        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
        >
          <span>Swagger API</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#121827] rounded-lg transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
