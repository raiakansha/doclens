import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react';
import type { DocumentResponse } from '../types';

interface LeftSidebarProps {
  documents: DocumentResponse[];
  selectedDocId: string;
  onSelectDocId: (id: string) => void;
  onOpenDocDetail: (doc: DocumentResponse) => void;
  onUploadFiles: (files: File[]) => void;
  uploading: boolean;
  uploadProgress?: number;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  documents,
  selectedDocId,
  onSelectDocId,
  onOpenDocDetail,
  onUploadFiles,
  uploading,
  uploadProgress = 0,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUploadFiles(acceptedFiles);
      }
    },
    [onUploadFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const filteredDocs = (documents || []).filter((d) =>
    (d?.fileName || '').toLowerCase().includes((filterQuery || '').toLowerCase())
  );

  const indexedCount = (documents || []).filter((d) => d?.status === 'INDEXED').length;

  return (
    <aside className="w-80 bg-[#0b0f19] border-r border-[#1b2437] flex flex-col h-full shrink-0 select-none">
      {/* Knowledge Base Header */}
      <div className="p-4 border-b border-[#1b2437] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">
              Knowledge Base
            </h2>
            <p className="text-[11px] text-slate-400">Indexed vector documents</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Upload Card Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-[#1b2437] hover:border-slate-600 bg-[#0f1422]/60 hover:bg-[#121827]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-200">
            <span className="text-blue-400">Upload document</span> or drag here
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            PDF, Word, Markdown, TXT, CSV (max 25MB)
          </p>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-3 text-left">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Indexing documents...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1b2437] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* All Documents Scope Item */}
        <button
          onClick={() => onSelectDocId('')}
          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
            selectedDocId === ''
              ? 'bg-blue-600/15 border-blue-500/40 text-white'
              : 'bg-[#121827]/60 border-[#1b2437] hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">All Documents</p>
              <p className="text-[10px] text-slate-400">Search across complete corpus</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#1b2437] text-slate-300">
            {documents.length}
          </span>
        </button>

        {/* Filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-[#121827] border border-[#1b2437] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Document Section Header */}
        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Documents ({filteredDocs.length})</span>
          <span>Status</span>
        </div>

        {/* Document List Cards */}
        <div className="space-y-2">
          {filteredDocs.map((doc, idx) => {
            const isSelected = doc?.id === selectedDocId;
            return (
              <div
                key={doc?.id || `doc-${idx}`}
                onClick={() => onOpenDocDetail(doc)}
                className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/40 text-white'
                    : 'bg-[#121827]/60 border-[#1b2437] hover:border-slate-700 hover:bg-[#161e31]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {doc?.fileName || 'Untitled Document'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mb-2">
                  {formatBytes(doc?.fileSize || 0)} • 1p
                </div>

                {/* Card Footer: Chunks count & status badge */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1b2437]/60 text-[11px]">
                  <span className="text-slate-400 font-mono">
                    # {doc?.chunksCreated ?? 0} chunks
                  </span>

                  {doc.status === 'INDEXED' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Indexed
                    </span>
                  )}
                  {(doc.status === 'UPLOADING' || doc.status === 'PROCESSING') && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Clock className="w-2.5 h-2.5 animate-spin" />
                      Processing
                    </span>
                  )}
                  {doc.status === 'FAILED' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              No documents found
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-[#1b2437] text-[11px] text-slate-500 flex items-center justify-between">
        <span>Ready: {indexedCount} files</span>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
};

export default LeftSidebar;
