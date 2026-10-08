import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import UploadModal from './components/UploadModal';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import SearchPage from './pages/SearchPage';
import ChunksPage from './pages/ChunksPage';
import UploadPage from './pages/UploadPage';
import { DocumentProvider, useDocuments } from './context/DocumentContext';
import { Upload } from 'lucide-react';

// ─── Layout wrapper ───────────────────────────────────────────────────────────
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { refresh } = useDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-950 relative">
        {/* Top bar */}
        <header className="flex items-center justify-end px-6 py-3 border-b border-gray-800 bg-gray-900/40 shrink-0">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-900/30"
          >
            <Upload size={14} />
            Upload Document
          </button>
        </header>

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <DocumentProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#1f2937' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#1f2937' },
            },
          }}
        />
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/chunks" element={<ChunksPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DocumentProvider>
  );
};

export default App;
