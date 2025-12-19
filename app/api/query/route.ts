import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEmbedding } from "@/lib/rag/embeddings"
import { generateText } from "ai"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Query route called")

    const body = await request.json()
    const { question } = body

    if (!question) {
      return NextResponse.json({ error: "Frage ist erforderlich" }, { status: 400 })
    }

    console.log("[v0] Question:", question)

    const supabase = await createClient()

    console.log("[v0] Generating embedding for question with OpenAI...")
    const questionEmbedding = await generateEmbedding(question)
    console.log("[v0] Question embedding generated (", questionEmbedding.length, "dimensions)")

    console.log("[v0] Searching for similar chunks using pgvector...")
    const { data: similarChunks, error: searchError } = await supabase.rpc("match_document_chunks", {
      query_embedding: questionEmbedding,
      match_threshold: 0.3,
      match_count: 5,
    })

    if (searchError) {
      console.error("[v0] Vector search error:", searchError)
      return NextResponse.json({ error: `Vector search failed: ${searchError.message}` }, { status: 500 })
    }

    console.log("[v0] Found", similarChunks?.length || 0, "similar chunks")

    if (!similarChunks || similarChunks.length === 0) {
      return NextResponse.json({
        answer: "Entschuldigung, ich konnte keine relevanten Informationen in den hochgeladenen Dokumenten finden.",
        sources: [],
      })
    }

    const documentIds = [...new Set(similarChunks.map((chunk: any) => chunk.document_id))]
    const { data: documents } = await supabase.from("documents").select("id, title").in("id", documentIds)

    const documentMap = new Map(documents?.map((doc: any) => [doc.id, doc.title]) || [])

    const context = similarChunks.map((chunk: any) => chunk.chunk_text).join("\n\n")

    console.log("[v0] Generating AI answer with GPT-4...")
    const answer = await generateAnswer(question, context)
    console.log("[v0] Answer generated")

    const sourcesWithTitles = similarChunks.map((chunk: any) => ({
      document_title: documentMap.get(chunk.document_id) || "Unbekanntes Dokument",
      chunk_text: chunk.chunk_text.slice(0, 200) + "...",
      similarity: chunk.similarity,
    }))

    return NextResponse.json({
      answer,
      sources: sourcesWithTitles,
    })
  } catch (error) {
    console.error("[v0] Query error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler bei der Abfrage" },
      { status: 500 },
    )
  }
}

async function generateAnswer(question: string, context: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Du bist ein hilfreicher AI-Assistent für Dokumentenanalyse. Beantworte die folgende Frage basierend AUSSCHLIESSLICH auf dem gegebenen Kontext aus den hochgeladenen Dokumenten.

Wichtige Regeln:
- Antworte NUR auf Basis der bereitgestellten Informationen
- Wenn die Antwort nicht im Kontext steht, sage das ehrlich
- Gebe klare, präzise Antworten auf Deutsch
- Zitiere relevante Stellen wenn passend

Kontext aus Dokumenten:
${context}

Frage: ${question}

Antwort:`,
    })

    return text
  } catch (error) {
    console.error("[v0] AI generation error:", error)
    throw new Error(`Failed to generate answer: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
