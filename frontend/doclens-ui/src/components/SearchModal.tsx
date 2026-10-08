import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, FileText, Zap, BookOpen, Hash, Loader2 } from 'lucide-react';
import { searchSimilarity } from '../api/client';
import type { CitationDto, SearchResult } from '../types';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  selectedDocId?: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, selectedDocId }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // toggle open
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const resp = await searchSimilarity({
        query: query.trim(),
        documentId: selectedDocId || undefined,
        topK: 6,
        similaritySearch: 0.3,
      });
      if (resp.success) {
        setResult(resp.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl bg-[#0e1422] border border-[#242e47] rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2942]">
          <div className="flex items-center gap-2.5 text-blue-400">
            <Search className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Semantic Vector Similarity Search
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1b253b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="p-6 border-b border-[#1f2942]">
          <div className="flex gap-3">
            <div className="flex-1 relative flex items-center bg-[#141b2d] border border-[#242e47] focus-within:border-blue-500 rounded-xl px-4 py-3 transition-colors">
              <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search concepts, clauses, or facts across vector chunks..."
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResult(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition-colors shrink-0 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Results Area / Empty State */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-sm text-slate-400">Searching vector store...</p>
            </div>
          )}

          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">
                Type a search term above to inspect matching vector chunks.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>
                  Found <strong className="text-blue-400">{result.totalMatches}</strong> matching chunks
                </span>
                <span>Query: "{result.query}"</span>
              </div>

              {result.matches.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No matching vector chunks found.
                </div>
              ) : (
                result.matches.map((match: CitationDto, idx: number) => {
                  const score = Math.round((match.similarityScore ?? 0) * 100);
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-[#141b2d] border border-[#242e47] rounded-xl hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {match.fileName}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                          <Zap className="w-3 h-3" />
                          {score}% match
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#0b0f19] p-3 rounded-lg border border-[#1b253b] mb-2 line-clamp-4">
                        {match.snippet}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        {match.pageNumber != null && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Page {match.pageNumber}
                          </span>
                        )}
                        {match.chunkIndex != null && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" /> Chunk #{match.chunkIndex}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
