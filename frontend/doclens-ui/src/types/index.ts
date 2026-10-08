// ─── API Wrapper ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}

// ─── Documents ───────────────────────────────────────────────────────────────
export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'INDEXED' | 'FAILED';

export interface DocumentResponse {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: DocumentStatus;
  chunksCreated: number;
  message: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface CitationDto {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  pageNumber: number;
  snippet: string;
  similarityScore: number;
  metadata: Record<string, unknown>;
}

export interface ChatRequest {
  question: string;
  documentId?: string;
  topK?: number;
  minSimilarity?: number;
  maxSimilarity?: number;
  conversationId?: string;
}

export interface ChatResponse {
  answer: string;
  conversationId: string;
  citations: CitationDto[];
  responseTimeMs: number;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchRequest {
  query: string;
  documentId?: string;
  topK?: number;
  similaritySearch?: number;
}

export interface SearchResult {
  query: string;
  totalMatches: number;
  matches: CitationDto[];
}

// ─── Chat Session ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationDto[];
  timestamp: Date;
  responseTimeMs?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  documentId?: string;
}

// ─── Upload tracking ─────────────────────────────────────────────────────────
export interface UploadFileItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  result?: DocumentResponse;
  error?: string;
}
