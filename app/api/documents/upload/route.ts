import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

function sanitizeText(text: string): string {
  return text.replace(/\u0000/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse JSON body
    const { title, content, fileType } = await request.json()

    if (!content || content.length < 10) {
      return NextResponse.json({ error: "Inhalt ist zu kurz" }, { status: 400 })
    }

    const cleanContent = sanitizeText(content)

    // Step 2: Create chunks (1000 chars, 200 overlap)
    const chunks: string[] = []
    const chunkSize = 1000
    const overlap = 200

    for (let i = 0; i < cleanContent.length; i += chunkSize - overlap) {
      const chunk = cleanContent.slice(i, i + chunkSize)
      if (chunk.trim().length > 50) {
        chunks.push(chunk.trim())
      }
    }

    // Step 3: Generate embeddings for each chunk using OpenAI
    const chunksWithEmbeddings: Array<{ text: string; embedding: number[] }> = []

    for (let i = 0; i < chunks.length; i++) {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: chunks[i],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const embedding = data.data[0].embedding

      chunksWithEmbeddings.push({ text: chunks[i], embedding })
    }

    // Step 4: Insert document into database
    const supabase = await createClient()

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        title: sanitizeText(title),
        content: cleanContent.slice(0, 50000),
        file_type: fileType,
      })
      .select("id")
      .single()

    if (docError) {
      throw new Error(docError.message)
    }

    // Step 5: Insert chunks with embeddings
    const chunkRows = chunksWithEmbeddings.map((c, i) => ({
      document_id: doc.id,
      chunk_text: c.text,
      chunk_index: i,
      embedding: c.embedding,
    }))

    const { error: chunksError } = await supabase.from("document_chunks").insert(chunkRows)

    if (chunksError) {
      throw new Error(chunksError.message)
    }

    return NextResponse.json({
      success: true,
      message: `Dokument "${sanitizeText(title)}" erfolgreich hochgeladen mit ${chunks.length} Chunks`,
      documentId: doc.id,
      chunks: chunks.length,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload fehlgeschlagen" },
      { status: 500 },
    )
  }
}
