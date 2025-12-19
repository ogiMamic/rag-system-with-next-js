# RAG System mit Next.js und Supabase

Ein vollständiges Retrieval-Augmented-Generation (RAG) System, entwickelt mit Next.js 16, Supabase und dem Vercel AI SDK.

## Features

- **Dokumenten-Upload**: Laden Sie Textdokumente in die Wissensbasis hoch
- **Intelligente Chunking**: Automatische Aufteilung in sinnvolle Textabschnitte
- **Vector Embeddings**: Semantische Suche mit pgvector
- **RAG-basierte Q&A**: Stellen Sie Fragen und erhalten Sie kontextbasierte Antworten
- **Source Citations**: Transparente Quellenangaben für jede Antwort

## Tech Stack

- **Frontend**: Next.js 16 mit App Router, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Server Actions
- **Datenbank**: Supabase (PostgreSQL mit pgvector Extension)
- **AI**: Vercel AI SDK mit OpenAI GPT-4o-mini
- **UI Components**: shadcn/ui (Radix UI + Tailwind)

## Schnellstart

### 1. Repository klonen

```bash
git clone <repository-url>
cd rag-system-nextjs
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen

Alle Supabase-Variablen sind bereits konfiguriert. Für die AI-Funktionalität:

```env
# Optional: Für bessere AI-Antworten
OPENAI_API_KEY=your_openai_key
```

### 4. Datenbank Setup

Die SQL-Skripte in \`scripts/\` werden automatisch ausgeführt:

1. \`001_create_documents_table.sql\` - Erstellt Tabellen für Dokumente und Chunks
2. \`002_create_vector_search_function.sql\` - Vector Similarity Search Funktion

**Wichtig**: Stellen Sie sicher, dass die pgvector Extension in Supabase aktiviert ist.

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000)

## Verwendung

### Dokumente hochladen

1. Klicken Sie auf "Dokument hochladen"
2. Geben Sie einen Titel ein
3. Fügen Sie den Textinhalt ein
4. Klicken Sie auf "Dokument hochladen"

Das System erstellt automatisch:
- Embeddings für semantische Suche
- Text-Chunks für bessere Retrieval-Qualität
- Vektor-Index für schnelle Ähnlichkeitssuche

### Fragen stellen

1. Wechseln Sie zu "Fragen stellen"
2. Geben Sie Ihre Frage ein
3. Das System:
   - Findet relevante Dokumentabschnitte
   - Generiert kontextbasierte Antwort
   - Zeigt Quellenangaben an

## Architektur

### Datenbankschema

- \`documents\`: Speichert hochgeladene Dokumente
- \`document_chunks\`: Text-Chunks mit Embeddings (vector(1536))
- \`questions\`: Gespeicherte Fragen und Antworten mit Quellenangaben

### API Endpoints

- \`POST /api/documents/upload\`: Dokument hochladen und verarbeiten
- \`GET /api/documents\`: Alle Dokumente abrufen
- \`POST /api/query\`: Frage stellen und Antwort erhalten

### RAG Pipeline

1. **Indexierung**:
   - Dokument → Chunking → Embedding Generation → Vektor-Speicherung

2. **Retrieval**:
   - Frage → Embedding → Vector Similarity Search → Top-K Chunks

3. **Generation**:
   - Chunks + Frage → LLM (GPT-4o-mini) → Antwort

## Deployment

### Vercel (Empfohlen)

1. Pushen Sie den Code zu GitHub
2. Verbinden Sie das Repository mit Vercel
3. Vercel erkennt automatisch Next.js
4. Environment Variables sind bereits konfiguriert
5. Deploy!

### Manuell

```bash
npm run build
npm start
```

## Erweiterungsmöglichkeiten

- **File Upload**: PDF/DOCX Parser hinzufügen
- **Multi-Modal**: Bilder und Tabellen verarbeiten
- **Chat History**: Konversationskontext speichern
- **Advanced Search**: Filter nach Datum, Typ, etc.
- **Authentication**: User-spezifische Wissensbasis
- **Analytics**: Tracking von häufigen Fragen

## Lizenz

MIT
```
