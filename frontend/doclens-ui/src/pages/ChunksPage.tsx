import React, { useState } from 'react';
import { Layers, Search, Loader2, X, FileText, Hash, BookOpen, Zap, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { searchSimilarity } from '../api/client';
import { useDocuments } from '../context/DocumentContext';
import type { CitationDto } from '../types';
import toast from 'react-hot-toast';

// ─── Chunk detail expander ────────────────────────────────────────────────────
const ChunkCard: React.FC<{ chunk: CitationDto; index: number }> = ({ chunk, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = Math.round((chunk.similarityScore ?? 0) * 100);
  const scoreColor = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red';

  const metaEntries = chunk.metadata ? Object.entries(chunk.metadata) : [];

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 animate-fade-in ${
      expanded ? 'border-indigo-500/40 bg-gray-800/60' : 'border-gray-700/60 bg-gray-800/30 hover:bg-gray-800/50'
    }`}>
      {/* Summary row */}
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Index */}
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-300 text-xs flex items-center justify-center font-mono font-bold">
          {index + 1}
        </span>

        {/* File + chunk */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <FileText size={13} className="text-indigo-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-200 truncate">{chunk.fileName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Hash size={11} /> Chunk {chunk.chunkIndex}
            </span>
            {chunk.pageNumber != null && (
              <span className="flex items-center gap-1">
                <BookOpen size={11} /> Page {chunk.pageNumber}
              </span>
            )}
          </div>
        </div>

        {/* Snippet preview */}
        <p className="hidden md:block flex-1 text-xs text-gray-500 truncate max-w-xs">
          {chunk.snippet?.slice(0, 80)}…
        </p>

        {/* Score */}
        <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border text-${scoreColor}-400 bg-${scoreColor}-900/20 border-${scoreColor}-700/40`}>
          <Zap size={10} className="inline mr-1" />
          {score}%
        </span>

        {expanded ? (
          <ChevronDown size={16} className="text-gray-500 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-gray-500 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-700/50 px-5 py-4 space-y-4 animate-fade-in">
          {/* Full snippet */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Chunk Content
            </p>
            <div className="bg-gray-900/70 border border-gray-700/40 rounded-lg p-4">
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{chunk.snippet}</p>
            </div>
          </div>

          {/* Metadata */}
          {metaEntries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info size={12} /> Metadata
              </p>
              <div className="grid grid-cols-2 gap-2">
                {metaEntries.map(([key, val]) => (
                  <div key={key} className="bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-700/30">
                    <p className="text-xs text-gray-500 mb-0.5">{key}</p>
                    <p className="text-xs text-gray-300 font-mono truncate">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document ID */}
          <p className="text-xs text-gray-600 font-mono">Doc ID: {chunk.documentId}</p>
        </div>
      )}
    </div>
  );
};

// ─── Chunks Page ──────────────────────────────────────────────────────────────
const ChunksPage: React.FC = () => {
  const { documents } = useDocuments();
  const [query, setQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [topK, setTopK] = useState(10);
  const [chunks, setChunks] = useState<CitationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setChunks([]);
    setSearched(false);

    try {
      const resp = await searchSimilarity({
        query: query.trim(),
        documentId: selectedDocId || undefined,
        topK,
        similaritySearch: 0.3,
      });
      if (resp.success) {
        setChunks(resp.data.matches ?? []);
        setTotalMatches(resp.data.totalMatches ?? 0);
        setSearched(true);
      }
    } catch {
      toast.error('Failed to retrieve chunks');
    } finally {
      setLoading(false);
    }
  };

  const indexedDocs = documents.filter((d) => d.status === 'INDEXED');

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers size={20} className="text-indigo-400" />
          Document Chunks
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Explore the vector chunks stored in your document index
        </p>
      </div>

      {/* Controls */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-wrap gap-3">
          {/* Query */}
          <div className="flex-1 min-w-64 flex items-center gap-2 bg-gray-800 border border-gray-700 focus-within:border-indigo-500 rounded-xl px-4 py-2.5 transition-colors">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chunks by semantic query…"
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setChunks([]); setSearched(false); }}>
                <X size={15} className="text-gray-500 hover:text-gray-300" />
              </button>
            )}
          </div>

          {/* Doc filter */}
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All documents</option>
            {indexedDocs.map((d) => (
              <option key={d.id} value={d.id}>{d.fileName}</option>
            ))}
          </select>

          {/* TopK */}
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5">
            <label className="text-xs text-gray-400">Top</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-12 bg-transparent text-sm text-indigo-300 text-center focus:outline-none"
            />
            <label className="text-xs text-gray-400">chunks</label>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Retrieve Chunks
          </button>
        </div>
      </form>

      {/* Stats bar */}
      {searched && !loading && (
        <div className="flex items-center gap-4 mb-4 text-sm animate-fade-in">
          <span className="text-gray-400">
            Showing <span className="text-indigo-400 font-semibold">{chunks.length}</span> of{' '}
            <span className="text-indigo-400 font-semibold">{totalMatches}</span> chunks
          </span>
          {selectedDocId && (
            <span className="text-gray-500 text-xs">
              Filtered to: {documents.find((d) => d.id === selectedDocId)?.fileName}
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 size={32} className="text-indigo-400 animate-spin" />
          <p className="text-gray-400 text-sm">Retrieving chunks…</p>
        </div>
      )}

      {/* Chunks list */}
      {!loading && chunks.length > 0 && (
        <div className="space-y-2">
          {chunks.map((chunk, i) => (
            <ChunkCard key={`${chunk.documentId}-${chunk.chunkIndex}-${i}`} chunk={chunk} index={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && chunks.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Layers size={40} className="mx-auto mb-3 text-gray-700" />
          <p>No chunks found for this query.</p>
          <p className="text-sm mt-1">Try a different query or lower the similarity threshold.</p>
        </div>
      )}

      {/* Initial empty */}
      {!loading && !searched && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
          <Layers size={48} className="text-gray-800" />
          <p className="text-gray-500">Enter a query to explore document chunks</p>
          <p className="text-xs text-gray-600 max-w-sm text-center">
            Each chunk represents a segment of your indexed documents stored as vector embeddings
          </p>
        </div>
      )}
    </div>
  );
};

export default ChunksPage;
