import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEmbedding } from "@/lib/rag/embeddings"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { question } = await request.json()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question)

    // Search for similar chunks using vector similarity
    const { data: similarChunks, error: searchError } = await supabase.rpc("match_document_chunks", {
      query_embedding: questionEmbedding,
      match_threshold: 0.5,
      match_count: 5,
    })

    if (searchError) {
      console.error("[v0] Vector search error:", searchError)
      const { data: fallbackChunks } = await supabase
        .from("document_chunks")
        .select("chunk_text, document_id, documents(title)")
        .limit(5)

      const context = fallbackChunks?.map((chunk) => chunk.chunk_text).join("\n\n") || "No context available."
      const answer = await generateAnswer(question, context)

      return NextResponse.json({
        answer,
        sources: fallbackChunks || [],
        note: "Vector search unavailable, using recent documents",
      })
    }

    // Build context from similar chunks
    const context = similarChunks?.map((chunk: any) => chunk.chunk_text).join("\n\n") || "No relevant context found."

    // Generate answer using AI
    const answer = await generateAnswer(question, context)

    return NextResponse.json({
      answer,
      sources: similarChunks || [],
    })
  } catch (error) {
    console.error("[v0] Query error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process query" },
      { status: 500 },
    )
  }
}

async function generateAnswer(question: string, context: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Du bist ein hilfreicher Assistent. Beantworte die folgende Frage basierend auf dem gegebenen Kontext.

Kontext:
${context}

Frage: ${question}

Antwort (auf Deutsch):`,
    })

    return text
  } catch (error) {
    console.error("[v0] AI generation error:", error)
    // Fallback response
    return `Basierend auf den verfügbaren Dokumenten: ${context.slice(0, 500)}...`
  }
}
