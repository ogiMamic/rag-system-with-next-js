import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  console.log("[v0] === QUERY START ===")

  try {
    const { question } = await request.json()
    console.log("[v0] Question:", question)

    if (!question) {
      return NextResponse.json({ error: "Frage ist erforderlich" }, { status: 400 })
    }

    // Step 1: Generate embedding for the question
    console.log("[v0] Generating question embedding...")
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: question,
      }),
    })

    if (!embeddingResponse.ok) {
      throw new Error("Failed to generate question embedding")
    }

    const embeddingData = await embeddingResponse.json()
    const questionEmbedding = embeddingData.data[0].embedding
    console.log("[v0] Question embedding generated")

    // Step 2: Search for similar chunks using pgvector
    console.log("[v0] Searching similar chunks...")
    const supabase = await createClient()

    const { data: chunks, error: searchError } = await supabase.rpc("match_document_chunks", {
      query_embedding: questionEmbedding,
      match_threshold: 0.3,
      match_count: 5,
    })

    if (searchError) {
      console.error("[v0] Search error:", searchError)
      throw new Error(searchError.message)
    }

    console.log("[v0] Found", chunks?.length || 0, "similar chunks")

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        answer: "Keine relevanten Informationen gefunden. Bitte laden Sie zuerst Dokumente hoch.",
        sources: [],
      })
    }

    // Step 3: Get document titles for sources
    const documentIds = [...new Set(chunks.map((c: any) => c.document_id))]
    const { data: docs } = await supabase.from("documents").select("id, title").in("id", documentIds)

    const docMap = new Map(docs?.map((d: any) => [d.id, d.title]) || [])

    // Step 4: Build context from chunks
    const context = chunks.map((c: any) => c.chunk_text).join("\n\n---\n\n")

    // Step 5: Generate answer using GPT-4
    console.log("[v0] Generating answer with GPT-4...")
    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du bist ein hilfreicher Assistent für Dokumentenanalyse. Beantworte Fragen basierend auf dem bereitgestellten Kontext.

WICHTIGE REGELN:
1. Beantworte die Frage präzise und vollständig basierend auf dem Kontext
2. Wenn die genaue Antwort nicht im Kontext steht, gib relevante Informationen aus dem verfügbaren Material
3. Sei spezifisch und strukturiere deine Antwort klar
4. Wenn du Informationen zitierst, erwähne aus welchem Teil des Dokuments sie stammen
5. Bei Lebensläufen: Hebe wichtige Qualifikationen, Erfahrungen und Fähigkeiten hervor

Kontext aus den Dokumenten:
${context}`,
          },
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!chatResponse.ok) {
      throw new Error("Failed to generate answer")
    }

    const chatData = await chatResponse.json()
    const answer = chatData.choices[0].message.content

    console.log("[v0] === QUERY COMPLETE ===")

    // Build sources with document titles
    const sources = chunks.map((c: any) => ({
      document_title: docMap.get(c.document_id) || "Unbekannt",
      chunk_text: c.chunk_text.slice(0, 200) + "...",
      similarity: Math.round((c.similarity || 0) * 100) + "%",
    }))

    return NextResponse.json({ answer, sources })
  } catch (error) {
    console.error("[v0] Query error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Abfrage fehlgeschlagen" },
      { status: 500 },
    )
  }
}
