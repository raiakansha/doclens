import React, { useEffect, useState } from 'react';
import { FileText, Trash2, RefreshCw, Upload, FolderOpen, BarChart2 } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { deleteDocument } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import UploadModal from '../components/UploadModal';
import toast from 'react-hot-toast';

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const DocumentsPage: React.FC = () => {
  const { documents, loading, refresh } = useDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also remove its embeddings.')) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      await refresh();
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const indexed = documents.filter((d) => d.status === 'INDEXED').length;
  const processing = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'UPLOADING').length;
  const failed = documents.filter((d) => d.status === 'FAILED').length;
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunksCreated ?? 0), 0);

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Documents</h1>
          <p className="text-sm text-gray-400 mt-0.5">{documents.length} total documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <Upload size={15} />
            Upload
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Indexed', value: indexed, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/40' },
          { label: 'Processing', value: processing, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/40' },
          { label: 'Failed', value: failed, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/40' },
          { label: 'Total Chunks', value: totalChunks, color: 'text-indigo-400', bg: 'bg-indigo-900/20 border-indigo-800/40' },
        ].map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-4 ${stat.bg}`}>
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500">
          <FolderOpen size={48} className="text-gray-700" />
          <p className="text-lg font-medium text-gray-400">No documents yet</p>
          <p className="text-sm">Upload your first document to get started</p>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors mt-2"
          >
            <Upload size={16} />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/60 border-b border-gray-700">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Document
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Type
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Size
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  <BarChart2 size={13} className="inline mr-1" />
                  Chunks
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-indigo-400 shrink-0" />
                      <span className="text-sm text-gray-200 truncate max-w-xs">{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md uppercase">
                      {doc.fileType || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatBytes(doc.fileSize)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{doc.chunksCreated ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 disabled:opacity-50 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadModal open={uploadOpen} onClose={() => { setUploadOpen(false); refresh(); }} />
    </div>
  );
};

export default DocumentsPage;
