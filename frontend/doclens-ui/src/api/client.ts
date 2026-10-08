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

export const streamChat = async (
  req: ChatRequest,
  onChunk: (token: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  const response = await fetch('/api/v1/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, text/plain',
    },
    body: JSON.stringify(req),
    signal,
  });

  if (!response.ok) {
    let errorMsg = `Server error: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.message) errorMsg = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (Array.isArray(data)) {
      for (const item of data) {
        if (typeof item === 'string' && item !== '[DONE]') {
          onChunk(item);
        }
      }
    } else if (data && typeof data === 'object') {
      const text = (data as Record<string, unknown>).answer ??
        ((data as Record<string, unknown>).data as Record<string, unknown>)?.answer ??
        (data as Record<string, unknown>).message ?? '';
      if (typeof text === 'string' && text) {
        onChunk(text);
      }
    }
    return;
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported by browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('data:')) {
        let payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          return;
        }
        if ((payload.startsWith('"') && payload.endsWith('"')) || (payload.startsWith("'") && payload.endsWith("'"))) {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = payload.slice(1, -1);
          }
        }
        if (payload) {
          onChunk(payload);
        }
      } else if (trimmed === '[DONE]') {
        return;
      } else {
        onChunk(rawLine);
      }
    }
  }

  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data:')) {
      let payload = trimmed.slice(5).trim();
      if (payload !== '[DONE]' && payload) {
        if ((payload.startsWith('"') && payload.endsWith('"')) || (payload.startsWith("'") && payload.endsWith("'"))) {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = payload.slice(1, -1);
          }
        }
        onChunk(payload);
      }
    } else if (trimmed !== '[DONE]') {
      onChunk(trimmed);
    }
  }
};
