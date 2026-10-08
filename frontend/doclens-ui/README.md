# DocLens Frontend

React + TypeScript + Tailwind CSS v4 frontend for the DocLens AI Document Intelligence platform.

## Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8.x | Build tool |
| Tailwind CSS | 4.x | Styling |
| React Router DOM | 7.x | Client routing |
| Axios | 1.x | HTTP client |
| React Dropzone | 14.x | Drag & drop uploads |
| React Hot Toast | 2.x | Notifications |
| Lucide React | latest | Icons |

## Features

- **Document Upload** – Drag & drop single or multiple files (PDF, DOC, DOCX, TXT, MD, CSV) with per-file progress bars
- **Chat** – Multi-session Q&A with citations, template prompt library
- **Semantic Search** – Search clauses, concepts, and facts with filters
- **Document Chunks** – Explore raw vector chunks with expandable metadata
- **Documents Manager** – View, filter, and delete indexed documents

## Development

```bash
cd frontend/doclens-ui
npm install
npm run dev        # http://localhost:5173  (proxies /api → :8081)
npm run build      # production build
```

## Project Structure

```
src/
├── api/          # Axios client
├── components/   # Sidebar, UploadModal, StatusBadge, CitationCard
├── context/      # DocumentContext
├── pages/        # ChatPage, DocumentsPage, SearchPage, ChunksPage, UploadPage
├── types/        # TypeScript types matching backend DTOs
└── App.tsx
```

## Backend API Reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/documents/upload` | Upload single document |
| POST | `/api/v1/documents/upload-mutiple` | Upload multiple documents |
| GET | `/api/v1/documents` | List all documents |
| DELETE | `/api/v1/documents/{id}` | Delete document |
| POST | `/api/v1/chat/query` | RAG Q&A |
| POST | `/api/v1/chat/search/similarity` | Semantic similarity search |
