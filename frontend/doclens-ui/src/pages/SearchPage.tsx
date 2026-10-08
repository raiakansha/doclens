import React, { useState } from 'react';
import { Search, Loader2, Filter, X, FileText, Zap, BookOpen, Hash } from 'lucide-react';
import { searchSimilarity } from '../api/client';
import { useDocuments } from '../context/DocumentContext';
import type { CitationDto, SearchResult } from '../types';
import toast from 'react-hot-toast';

// ─── Search type tabs ─────────────────────────────────────────────────────────
const SEARCH_TYPES = [
  { id: 'clause', label: '⚖️ Clauses', placeholder: 'Search for legal clauses, terms, conditions…' },
  { id: 'concept', label: '💡 Concepts', placeholder: 'Search for key concepts, ideas, or topics…' },
  { id: 'fact', label: '📊 Facts', placeholder: 'Search for statistics, dates, numbers, or facts…' },
  { id: 'custom', label: '🔍 Custom', placeholder: 'Type any search query…' },
];

// ─── Result card ──────────────────────────────────────────────────────────────
const ResultCard: React.FC<{ citation: CitationDto; index: number }> = ({ citation, index }) => {
  const score = Math.round((citation.similarityScore ?? 0) * 100);
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = score >= 80 ? 'bg-emerald-900/20 border-emerald-700/40' : score >= 60 ? 'bg-amber-900/20 border-amber-700/40' : 'bg-red-900/20 border-red-700/40';

  return (
    <div className="border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/70 rounded-xl p-5 transition-all duration-200 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 text-xs flex items-center justify-center font-mono font-bold">
            {index + 1}
          </span>
          <FileText size={15} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-200 truncate">{citation.fileName}</span>
        </div>
        <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${scoreColor} ${scoreBg}`}>
          <Zap size={11} />
          {score}% match
        </div>
      </div>

      {/* Snippet */}
      <div className="bg-gray-900/60 rounded-lg p-3 mb-3 border border-gray-700/30">
        <p className="text-sm text-gray-300 leading-relaxed">{citation.snippet}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {citation.pageNumber != null && (
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} />
            Page {citation.pageNumber}
          </span>
        )}
        {citation.chunkIndex != null && (
          <span className="flex items-center gap-1.5">
            <Hash size={12} />
            Chunk {citation.chunkIndex}
          </span>
        )}
        {citation.documentId && (
          <span className="text-gray-600 text-xs truncate max-w-xs" title={citation.documentId}>
            ID: {citation.documentId.slice(0, 8)}…
          </span>
        )}
      </div>
    </div>
  );
};

// ─── SearchPage ───────────────────────────────────────────────────────────────
const SearchPage: React.FC = () => {
  const { documents } = useDocuments();
  const [activeType, setActiveType] = useState(SEARCH_TYPES[0].id);
  const [query, setQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [topK, setTopK] = useState(5);
  const [minScore, setMinScore] = useState(0.5);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const currentType = SEARCH_TYPES.find((t) => t.id === activeType)!;

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await searchSimilarity({
        query: query.trim(),
        documentId: selectedDocId || undefined,
        topK,
        similaritySearch: minScore,
      });
      if (resp.success) {
        setResult(resp.data);
      }
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResult(null);
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Semantic Search</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Search clauses, concepts, and facts across your documents
        </p>
      </div>

      {/* Search type tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {SEARCH_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeType === t.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-3 bg-gray-800 border border-gray-700 focus-within:border-indigo-500 rounded-xl px-4 py-3 transition-colors">
            <Search size={18} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentType.placeholder}
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            />
            {query && (
              <button type="button" onClick={clearSearch} className="text-gray-500 hover:text-gray-300">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all ${
              showFilters
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            <Filter size={15} />
          </button>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-gray-800/60 border border-gray-700/60 rounded-xl flex flex-wrap gap-6 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Document filter</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="text-sm bg-gray-900 border border-gray-600 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All documents</option>
                {documents.filter((d) => d.status === 'INDEXED').map((d) => (
                  <option key={d.id} value={d.id}>{d.fileName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Top results: <span className="text-indigo-400">{topK}</span></label>
              <input
                type="range"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="accent-indigo-500 w-32"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Min similarity: <span className="text-indigo-400">{Math.round(minScore * 100)}%</span></label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="accent-indigo-500 w-32"
              />
            </div>
          </div>
        )}
      </form>

      {/* Results */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 size={32} className="text-indigo-400 animate-spin" />
          <p className="text-gray-400 text-sm">Searching documents…</p>
        </div>
      )}

      {result && !loading && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              Found <span className="text-indigo-400 font-semibold">{result.totalMatches}</span> result
              {result.totalMatches !== 1 ? 's' : ''} for{' '}
              <span className="text-gray-200">"{result.query}"</span>
            </p>
          </div>

          {result.matches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={36} className="mx-auto mb-3 text-gray-700" />
              <p>No matching chunks found.</p>
              <p className="text-sm mt-1">Try lowering the similarity threshold or using different keywords.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.matches.map((match, i) => (
                <ResultCard key={i} citation={match} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
          <Search size={48} className="text-gray-800" />
          <p className="text-gray-500">Enter a query to search your documents</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
