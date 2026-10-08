import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DocumentResponse } from '../types';
import { getAllDocuments } from '../api/client';

interface DocumentContextValue {
  documents: DocumentResponse[];
  loading: boolean;
  refresh: () => Promise<void>;
  addDocuments: (docs: DocumentResponse[]) => void;
  removeDocument: (id: string) => void;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getAllDocuments();
      if (resp.success) setDocuments(resp.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const addDocuments = useCallback((docs: DocumentResponse[]) => {
    setDocuments((prev) => {
      const map = new Map(prev.map((d) => [d.id, d]));
      docs.forEach((d) => map.set(d.id, d));
      return Array.from(map.values());
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <DocumentContext.Provider value={{ documents, loading, refresh, addDocuments, removeDocument }}>
      {children}
    </DocumentContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDocuments = (): DocumentContextValue => {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocuments must be used within DocumentProvider');
  return ctx;
};
