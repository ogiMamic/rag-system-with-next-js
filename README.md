# RAG System mit Next.js und Supabase

Ein vollständiges Retrieval-Augmented-Generation (RAG) System für intelligente Dokumentenanalyse, entwickelt mit Next.js 16, Supabase und OpenAI.

## Problemstellung

Dieses System löst das Problem der intelligenten Dokumentensuche und -analyse. Statt manuell durch Dokumente zu suchen, können Benutzer natürliche Fragen stellen und erhalten kontextbasierte Antworten mit Quellenangaben.

## Features

- **PDF & Text Upload**: Laden Sie PDF, TXT, MD, JSON oder CSV Dateien hoch
- **Intelligentes Chunking**: Automatische Aufteilung in 1000-Zeichen-Chunks mit 200 Zeichen Überlappung
- **Vector Embeddings**: OpenAI text-embedding-3-small (1536 Dimensionen)
- **Semantische Suche**: pgvector mit HNSW-Index für schnelle Ähnlichkeitssuche
- **RAG-basierte Q&A**: GPT-4o-mini generiert Antworten basierend auf relevanten Dokumentabschnitten
- **Quellenangaben**: Transparente Anzeige der verwendeten Textpassagen mit Relevanz-Prozent

## Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UPLOAD FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│  PDF/Text File                                                      │
│       ↓                                                             │
│  Text Extraction (Browser - PDF.js)                                 │
│       ↓                                                             │
│  Chunking (1000 chars, 200 overlap)                                 │
│       ↓                                                             │
│  OpenAI Embeddings (text-embedding-3-small → 1536 dim)              │
│       ↓                                                             │
│  Supabase pgvector (documents + document_chunks tables)             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          QUERY FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│  User Question                                                      │
│       ↓                                                             │
│  OpenAI Embedding (same model)                                      │
│       ↓                                                             │
│  pgvector Similarity Search (cosine distance, top 5)                │
│       ↓                                                             │
│  Context Assembly (relevant chunks)                                 │
│       ↓                                                             │
│  GPT-4o-mini (answer generation with sources)                       │
│       ↓                                                             │
│  Response with Source Citations                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI) |
| Backend | Next.js API Routes |
| Datenbank | Supabase (PostgreSQL + pgvector) |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | OpenAI GPT-4o-mini |
| PDF Parsing | PDF.js (Client-side) |

## Design-Entscheidungen

| Entscheidung | Wert | Begründung |
|--------------|------|------------|
| Chunk-Größe | 1000 Zeichen | Balance zwischen Kontext und Präzision |
| Chunk-Überlappung | 200 Zeichen | Verhindert Informationsverlust an Chunk-Grenzen |
| Embedding-Modell | text-embedding-3-small | Kosteneffizient, 1536 Dimensionen |
| LLM | GPT-4o-mini | Schnell, kostengünstig, gute Qualität |
| Vector-Index | HNSW | Speichereffizient, schnelle Suche |
| Similarity Threshold | 0.3 | Niedrig genug für relevante Ergebnisse |
| Top-K Results | 5 | Genug Kontext ohne Token-Verschwendung |

## Datenbank-Schema

```sql
-- Dokumente
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks mit Embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW Index für schnelle Suche
CREATE INDEX document_chunks_embedding_idx 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Similarity Search Funktion
CREATE FUNCTION match_document_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
) RETURNS TABLE (...);
```

## API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/documents/upload` | POST | Dokument hochladen und verarbeiten |
| `/api/documents` | GET | Alle Dokumente abrufen |
| `/api/documents/[id]` | DELETE | Dokument löschen |
| `/api/query` | POST | Frage stellen und Antwort erhalten |

## Setup-Anleitung

### 1. Umgebungsvariablen

Benötigt (bereits in v0 konfiguriert):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (für Embeddings und GPT)
OPENAI_API_KEY=your_openai_key
```

### 2. Datenbank-Setup

Die pgvector Extension muss in Supabase aktiviert sein:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Entwicklung starten

```bash
npm install
npm run dev
```

## Verwendung

1. **Upload Tab**: PDF oder Textdatei auswählen und hochladen
2. **Fragen Tab**: Natürliche Frage eingeben und "Frage stellen" klicken
3. **Dokumente Tab**: Hochgeladene Dokumente verwalten und löschen

## Lizenz

MIT
