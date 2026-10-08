import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import MainChatView from './components/MainChatView';
import SearchModal from './components/SearchModal';
import DocumentDetailModal from './components/DocumentDetailModal';
import type { DocumentResponse, ChatMessage } from './types';
import {
  getAllDocuments,
  queryChat,
  uploadMultipleDocuments,
  streamChat,
} from './api/client';
import toast from 'react-hot-toast';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [streamTokens, setStreamTokens] = useState(true);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme state (dark / light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('doclens-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('doclens-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedDetailDoc, setSelectedDetailDoc] = useState<DocumentResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Upload tracking
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchDocuments = useCallback(async () => {
    try {
      const resp = await getAllDocuments();
      if (resp.success) {
        setDocuments(resp.data ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle uploading files from sidebar dropzone
  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const resp = await uploadMultipleDocuments(files, (pct) => {
        setUploadProgress(pct);
      });
      if (resp.success) {
        toast.success(`Successfully uploaded ${files.length} file(s)!`);
        await fetchDocuments();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Handle sending chat message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loadingChat) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoadingChat(true);

    const startTime = Date.now();

    if (streamTokens) {
      const aiMsgId = crypto.randomUUID();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      try {
        await streamChat(
          {
            question: text.trim(),
            documentId: selectedDocId || undefined,
            topK: 5,
            conversationId,
          },
          (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, content: m.content + token } : m
              )
            );
          }
        );
        const elapsed = Date.now() - startTime;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, responseTimeMs: elapsed } : m
          )
        );
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Streaming request failed';
        toast.error(`Streaming failed: ${errorMsg}`);
      } finally {
        setLoadingChat(false);
      }
    } else {
      try {
        const resp = await queryChat({
          question: text.trim(),
          documentId: selectedDocId || undefined,
          topK: 5,
          conversationId,
        });

        if (resp.success) {
          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: resp.data.answer,
            citations: resp.data.citations,
            timestamp: new Date(),
            responseTimeMs: resp.data.responseTimeMs,
          };
          setMessages((prev) => [...prev, aiMsg]);
          if (resp.data.conversationId) {
            setConversationId(resp.data.conversationId);
          }
        }
      } catch {
        toast.error('Failed to get answer. Please check your backend connection.');
      } finally {
        setLoadingChat(false);
      }
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationId(crypto.randomUUID());
    toast.success('Chat history cleared');
  };

  const handleOpenDocDetail = (doc: DocumentResponse) => {
    setSelectedDetailDoc(doc);
    setDetailModalOpen(true);
  };

  const handleDocumentDeleted = (deletedId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== deletedId));
    if (selectedDocId === deletedId) {
      setSelectedDocId('');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a11] text-slate-100 antialiased font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111726',
            color: '#f1f5f9',
            border: '1px solid #242e47',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />

      {/* Top Header Navbar */}
      <Header
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDoc={setSelectedDocId}
        onOpenSearchModal={() => setSearchModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Workspace Area: Left Sidebar + Main Chat */}
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar
          documents={documents}
          selectedDocId={selectedDocId}
          onSelectDocId={setSelectedDocId}
          onOpenDocDetail={handleOpenDocDetail}
          onUploadFiles={handleUploadFiles}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        <MainChatView
          messages={messages}
          loading={loadingChat}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          selectedDocId={selectedDocId}
          documents={documents}
          streamTokens={streamTokens}
          onToggleStreamTokens={setStreamTokens}
          onTriggerUpload={handleTriggerUpload}
        />
      </div>

      {/* Hidden File Input for header / chat upload buttons */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.csv"
        className="hidden"
      />

      {/* Modals */}
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        selectedDocId={selectedDocId}
      />

      <DocumentDetailModal
        open={detailModalOpen}
        document={selectedDetailDoc}
        onClose={() => setDetailModalOpen(false)}
        onSelectDocForChat={(id) => {
          setSelectedDocId(id);
          toast.success('Document selected for chat context');
        }}
        onDocumentDeleted={handleDocumentDeleted}
      />
    </div>
  );
};

export default App;
