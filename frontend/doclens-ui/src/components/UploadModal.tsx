import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { UploadFileItem } from '../types';
import { uploadMultipleDocuments } from '../api/client';
import { useDocuments } from '../context/DocumentContext';
import toast from 'react-hot-toast';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

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

const UploadModal: React.FC<UploadModalProps> = ({ open, onClose }) => {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const { addDocuments } = useDocuments();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: UploadFileItem[] = acceptedFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpload = async () => {
    const pending = items.filter((i) => i.status === 'pending');
    if (pending.length === 0) return;

    setUploading(true);
    setItems((prev) =>
      prev.map((i) => (i.status === 'pending' ? { ...i, status: 'uploading', progress: 0 } : i))
    );

    try {
      const files = pending.map((i) => i.file);
      const resp = await uploadMultipleDocuments(files, (pct) => {
        setItems((prev) =>
          prev.map((i) =>
            i.status === 'uploading' ? { ...i, progress: pct } : i
          )
        );
      });

      if (resp.success) {
        const docs = resp.data;
        addDocuments(docs);
        setItems((prev) =>
          prev.map((item) => {
            const match = docs.find((d) => d.fileName === item.file.name);
            return item.status === 'uploading'
              ? { ...item, status: 'done', progress: 100, result: match }
              : item;
          })
        );
        toast.success(`${docs.length} document(s) uploaded successfully`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setItems((prev) =>
        prev.map((i) =>
          i.status === 'uploading' ? { ...i, status: 'error', error: msg } : i
        )
      );
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setItems([]);
      onClose();
    }
  };

  if (!open) return null;

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
            <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, TXT, MD, CSV supported</p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drop zone */}
        <div className="px-6 pt-5">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-indigo-400 bg-indigo-900/20'
                : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload
              size={36}
              className={`mx-auto mb-3 ${isDragActive ? 'text-indigo-400' : 'text-gray-500'}`}
            />
            {isDragActive ? (
              <p className="text-indigo-300 font-medium">Drop files here…</p>
            ) : (
              <>
                <p className="text-gray-300 font-medium">Drag & drop files here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </>
            )}
          </div>
        </div>

        {/* File list */}
        {items.length > 0 && (
          <div className="px-6 mt-4 max-h-56 overflow-y-auto space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
              >
                <FileText size={18} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">{formatBytes(item.file.size)}</p>
                    {item.status === 'uploading' && (
                      <>
                        <span className="text-xs text-gray-500">·</span>
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-indigo-400 shrink-0">{item.progress}%</span>
                      </>
                    )}
                    {item.status === 'done' && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Done
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={11} /> {item.error}
                      </span>
                    )}
                  </div>
                </div>
                {item.status === 'pending' && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
                {item.status === 'done' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                {item.status === 'uploading' && <Loader2 size={16} className="text-indigo-400 animate-spin shrink-0" />}
                {item.status === 'error' && <AlertCircle size={16} className="text-red-400 shrink-0" />}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 mt-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            {doneCount > 0 ? `${doneCount} uploaded` : `${items.length} file(s) selected`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {doneCount > 0 ? 'Close' : 'Cancel'}
            </button>
            {pendingCount > 0 && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
