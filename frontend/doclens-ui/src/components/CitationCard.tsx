import React from 'react';
import type { CitationDto } from '../types';
import { FileText, Hash, BookOpen, Zap } from 'lucide-react';

interface CitationCardProps {
  citation: CitationDto;
  index: number;
}

const CitationCard: React.FC<CitationCardProps> = ({ citation, index }) => {
  const score = Math.round((citation.similarityScore ?? 0) * 100);
  const scoreColor =
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreBg =
    score >= 80 ? 'bg-emerald-900/30' : score >= 60 ? 'bg-amber-900/30' : 'bg-red-900/30';

  return (
    <div className="group border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/70 rounded-xl p-4 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-xs flex items-center justify-center font-mono">
            {index + 1}
          </span>
          <FileText size={14} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-medium text-gray-200 truncate">{citation.fileName}</span>
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-md ${scoreColor} ${scoreBg}`}>
          <Zap size={10} className="inline mr-1" />
          {score}%
        </span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 mb-3">
        {citation.snippet}
      </p>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        {citation.pageNumber != null && (
          <span className="flex items-center gap-1">
            <BookOpen size={11} />
            Page {citation.pageNumber}
          </span>
        )}
        {citation.chunkIndex != null && (
          <span className="flex items-center gap-1">
            <Hash size={11} />
            Chunk {citation.chunkIndex}
          </span>
        )}
      </div>
    </div>
  );
};

export default CitationCard;
