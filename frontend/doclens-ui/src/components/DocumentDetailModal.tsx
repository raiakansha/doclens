import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Copy,
  CheckCircle2,
  Trash2,
  MessageSquare,
  HardDrive,
  Layers,
  FileCode,
  Calendar,
  Loader2,
  Check,
} from 'lucide-react';
import type { DocumentResponse, CitationDto } from '../types';
import { searchSimilarity, deleteDocument } from '../api/client';
import toast from 'react-hot-toast';

interface DocumentDetailModalProps {
  document: DocumentResponse | null;
  open: boolean;
  onClose: () => void;
  onSelectDocForChat: (id: string) => void;
  onDocumentDeleted: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  open,
  onClose,
  onSelectDocForChat,
  onDocumentDeleted,
}) => {
  const [chunks, setChunks] = useState<CitationDto[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (open && document) {
      fetchChunks(document.id);
    } else {
      setChunks([]);
    }
  }, [open, document]);

  const fetchChunks = async (docId: string) => {
    setLoadingChunks(true);
    try {
      const resp = await searchSimilarity({
        query: 'document overview summary content',
        documentId: docId,
        topK: 20,
        similaritySearch: 0.0,
      });
      if (resp.success) {
        setChunks(resp.data.matches ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingChunks(false);
    }
  };

  if (!open || !document) return null;

  const copyDocId = () => {
    navigator.clipboard.writeText(document.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    toast.success('Document ID copied!');
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${document.fileName}"? This will purge all stored vector embeddings.`
      )
    )
      return;

    setDeleting(true);
    try {
      await deleteDocument(document.id);
      toast.success('Document deleted successfully');
      onDocumentDeleted(document.id);
      onClose();
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleStartChat = () => {
    onSelectDocForChat(document.id);
    onClose();
    toast.success(`Chat scoped to ${document.fileName}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-3xl bg-[#0e1422] border border-[#242e47] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1f2942]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {document.fileName}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  INDEXED
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="font-mono">{document.id}</span>
                <button
                  onClick={copyDocId}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                  title="Copy Document ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1b253b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 4 Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#141b2d] border border-[#242e47] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span>File Size</span>
              </div>
              <p className="text-sm font-bold text-slate-100">
                {formatBytes(document.fileSize)}
              </p>
            </div>

            <div className="p-3.5 bg-[#141b2d] border border-[#242e47] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Vector Chunks</span>
              </div>
              <p className="text-sm font-bold text-slate-100">
                {document.chunksCreated ?? chunks.length} Chunks
              </p>
            </div>

            <div className="p-3.5 bg-[#141b2d] border border-[#242e47] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Total Pages</span>
              </div>
              <p className="text-sm font-bold text-slate-100">1 Pages</p>
            </div>

            <div className="p-3.5 bg-[#141b2d] border border-[#242e47] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Uploaded</span>
              </div>
              <p className="text-sm font-bold text-slate-100">08/08/2026</p>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 pt-2 border-t border-[#1f2942]">
            <span>INDEXED VECTOR CHUNKS</span>
            <span>SAMPLE CHUNKS</span>
          </div>

          {/* Chunks List */}
          {loadingChunks ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="text-xs text-slate-400">Loading vector chunks...</span>
            </div>
          ) : chunks.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 bg-[#141b2d] rounded-xl border border-[#242e47] p-6">
              No vector chunks stored for this document yet.
            </div>
          ) : (
            <div className="space-y-3">
              {chunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#141b2d] border border-[#242e47] rounded-xl font-mono text-xs"
                >
                  <p className="font-bold text-slate-400 mb-2 font-sans text-xs">
                    Chunk #{chunk.chunkIndex ?? idx}
                  </p>
                  <p className="text-slate-300 leading-relaxed bg-[#0b0f19] p-3 rounded-lg border border-[#1b253b] whitespace-pre-wrap line-clamp-6">
                    {chunk.snippet}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1f2942] bg-[#0b0f19]">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 rounded-xl transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Document
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#141b2d] hover:bg-[#1a233b] border border-[#242e47] rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleStartChat}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;
