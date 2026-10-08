import React, { useState } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle, Loader2, X, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../api/client';
import { useDocuments } from '../context/DocumentContext';
import type { UploadFileItem } from '../types';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const UploadPage: React.FC = () => {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const { addDocuments } = useDocuments();

  const onDrop = (files: File[]) => {
    const newItems: UploadFileItem[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id && i.status !== 'uploading'));
  };

  const uploadItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.status !== 'pending') return;

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'uploading', progress: 0 } : i)));

    try {
      const resp = await uploadDocument(item.file, (pct) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, progress: pct } : i)));
      });

      if (resp.success) {
        addDocuments([resp.data]);
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, status: 'done', progress: 100, result: resp.data } : i
          )
        );
        toast.success(`${item.file.name} uploaded!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'error', error: msg } : i))
      );
      toast.error(msg);
    }
  };

  const uploadAll = async () => {
    const pending = items.filter((i) => i.status === 'pending');
    for (const item of pending) {
      await uploadItem(item.id);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Upload Documents</h1>
        <p className="text-sm text-gray-400 mt-0.5">Add documents to your knowledge base for AI analysis</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-indigo-900/20 border border-indigo-700/40 rounded-xl mb-6">
        <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-indigo-300 font-medium">Supported formats</p>
          <p className="text-xs text-indigo-400/70 mt-0.5">PDF · DOC · DOCX · TXT · Markdown · CSV</p>
          <p className="text-xs text-indigo-400/70 mt-1">
            Documents are automatically chunked and indexed into a vector store for semantic search and RAG-based Q&A.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 mb-6 ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-900/20'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${
          isDragActive ? 'bg-indigo-600/30' : 'bg-gray-800'
        }`}>
          <UploadIcon size={28} className={isDragActive ? 'text-indigo-400' : 'text-gray-500'} />
        </div>
        {isDragActive ? (
          <p className="text-lg font-medium text-indigo-300">Drop your files here!</p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-300">Drag & drop files here</p>
            <p className="text-sm text-gray-500 mt-2">or click to open file picker</p>
            <p className="text-xs text-gray-600 mt-3">Maximum file size: 50 MB</p>
          </>
        )}
      </div>

      {/* Upload all button */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            <span className="text-indigo-400 font-semibold">{pendingCount}</span> file{pendingCount > 1 ? 's' : ''} ready to upload
          </p>
          <button
            onClick={uploadAll}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            <UploadIcon size={15} />
            Upload All
          </button>
        </div>
      )}

      {/* File list */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`border rounded-xl p-4 transition-all ${
                item.status === 'done'
                  ? 'border-emerald-700/40 bg-emerald-900/10'
                  : item.status === 'error'
                  ? 'border-red-700/40 bg-red-900/10'
                  : 'border-gray-700/60 bg-gray-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-200 truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'done' && item.result && (
                        <StatusBadge status={item.result.status} />
                      )}
                      {item.status === 'done' && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {item.status === 'error' && <AlertCircle size={16} className="text-red-400" />}
                      {item.status === 'uploading' && <Loader2 size={16} className="text-indigo-400 animate-spin" />}
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => uploadItem(item.id)}
                            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                          >
                            Upload
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <X size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{formatBytes(item.file.size)}</span>
                    {item.status === 'done' && item.result && (
                      <span className="text-xs text-emerald-400">
                        {item.result.chunksCreated} chunks created
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs text-red-400">{item.error}</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(item.status === 'uploading' || item.status === 'done') && (
                    <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadPage;
