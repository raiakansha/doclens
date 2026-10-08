import axios from 'axios';
import type {
  ApiResponse,
  ChatRequest,
  ChatResponse,
  DocumentResponse,
  SearchRequest,
  SearchResult,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Documents ──────────────────────────────────────────────────────────────

export const uploadDocument = (
  file: File,
  onProgress?: (pct: number) => void
): Promise<ApiResponse<DocumentResponse>> => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<ApiResponse<DocumentResponse>>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then((r) => r.data);
};

export const uploadMultipleDocuments = (
  files: File[],
  onProgress?: (pct: number) => void
): Promise<ApiResponse<DocumentResponse[]>> => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return api
    .post<ApiResponse<DocumentResponse[]>>('/documents/upload-mutiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then((r) => r.data);
};

export const getAllDocuments = (): Promise<ApiResponse<DocumentResponse[]>> =>
  api.get<ApiResponse<DocumentResponse[]>>('/documents').then((r) => r.data);

export const getDocumentById = (id: string): Promise<ApiResponse<DocumentResponse>> =>
  api.get<ApiResponse<DocumentResponse>>(`/documents/${id}`).then((r) => r.data);

export const deleteDocument = (id: string): Promise<ApiResponse<void>> =>
  api.delete<ApiResponse<void>>(`/documents/${id}`).then((r) => r.data);

// ─── Chat ────────────────────────────────────────────────────────────────────

export const queryChat = (req: ChatRequest): Promise<ApiResponse<ChatResponse>> =>
  api.post<ApiResponse<ChatResponse>>('/chat/query', req).then((r) => r.data);

export const searchSimilarity = (req: SearchRequest): Promise<ApiResponse<SearchResult>> =>
  api.post<ApiResponse<SearchResult>>('/chat/search/similarity', req).then((r) => r.data);
