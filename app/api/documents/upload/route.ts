import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateBatchEmbeddings } from "@/lib/rag/embeddings"
import { chunkText } from "@/lib/rag/chunking"
import { sanitizeText } from "@/lib/rag/text-sanitizer"

export const runtime = "nodejs"
export const maxDuration = 60 // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, content, fileType, customPrompt } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Titel und Inhalt sind erforderlich" }, { status: 400 })
    }

    const sanitizedContent = sanitizeText(content)

    if (sanitizedContent.length < 10) {
      return NextResponse.json({ error: "Dokument ist zu kurz oder leer" }, { status: 400 })
    }

    console.log("[v0] Processing document:", title, "Content length:", sanitizedContent.length)

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title,
        content: sanitizedContent,
        file_type: fileType || "text/plain",
      })
      .select()
      .single()

    if (docError) {
      console.error("[v0] Document insert error:", docError)
      throw docError
    }

    console.log("[v0] Document inserted:", document.id)

    const chunks = chunkText(sanitizedContent)
    console.log("[v0] Created chunks:", chunks.length)

    if (chunks.length === 0) {
      return NextResponse.json({ error: "Keine Chunks erstellt" }, { status: 400 })
    }

    console.log("[v0] Starting embedding generation for", chunks.length, "chunks")

    const BATCH_SIZE = 50 // Process 50 chunks at a time
    const allChunkInserts = []

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE)
      const batchTexts = batchChunks.map((chunk) => sanitizeText(chunk.text))

      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)
      console.log(`[v0] Processing batch ${batchNumber}/${totalBatches} with ${batchChunks.length} chunks`)

      try {
        const embeddings = await generateBatchEmbeddings(batchTexts)
        console.log(`[v0] Generated ${embeddings.length} embeddings for batch ${batchNumber}`)

        const batchInserts = batchChunks.map((chunk, idx) => ({
          document_id: document.id,
          chunk_text: sanitizeText(chunk.text),
          chunk_index: chunk.index,
          embedding: `[${embeddings[idx].join(",")}]`,
        }))

        allChunkInserts.push(...batchInserts)
      } catch (error) {
        console.error(`[v0] Error generating embeddings for batch ${batchNumber}:`, error)
        throw new Error(
          `Embedding generation failed at batch ${batchNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }

    console.log("[v0] All embeddings generated, inserting", allChunkInserts.length, "chunks into database")

    const { error: chunksError } = await supabase.from("document_chunks").insert(allChunkInserts)

    if (chunksError) {
      console.error("[v0] Chunks insert error:", chunksError)
      throw chunksError
    }

    console.log("[v0] Upload completed successfully")

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          title: document.title,
          chunks: chunks.length,
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Document upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Hochladen" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
