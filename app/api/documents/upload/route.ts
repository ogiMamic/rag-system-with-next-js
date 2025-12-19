import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { chunkText } from "@/lib/rag/chunking"
import { sanitizeText } from "@/lib/rag/text-sanitizer"

export const runtime = "nodejs"
export const maxDuration = 60

async function generateEmbedding(text: string, timeoutMs = 30000): Promise<number[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenAI API timeout after 30 seconds")
    }
    throw error
  }
}

async function generateBatchEmbeddingsWithTimeout(
  texts: string[],
  batchNumber: number,
  totalBatches: number,
): Promise<number[][]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  console.log(`[v0] Batch ${batchNumber}/${totalBatches}: Calling OpenAI API for ${texts.length} texts...`)

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] Batch ${batchNumber}: OpenAI API error:`, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[v0] Batch ${batchNumber}: Received ${data.data.length} embeddings`)

    // Sort by index to maintain order
    const sorted = data.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    return sorted.map((item: { embedding: number[] }) => item.embedding)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`[v0] Batch ${batchNumber}: Timeout after 30 seconds`)
      throw new Error(`Batch ${batchNumber} timeout`)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log("[v0] ========== UPLOAD START ==========")

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OPENAI_API_KEY is not set!")
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }
    console.log("[v0] OpenAI API key is present")

    // Parse request body
    console.log("[v0] Step 1: Parsing request body...")
    const body = await request.json()
    const { title, content, fileType } = body
    console.log("[v0] Received:", { title, contentLength: content?.length, fileType })

    if (!title || !content) {
      return NextResponse.json({ error: "Titel und Inhalt sind erforderlich" }, { status: 400 })
    }

    // Sanitize content
    console.log("[v0] Step 2: Sanitizing content...")
    const sanitizedContent = sanitizeText(content)
    console.log("[v0] Sanitized content length:", sanitizedContent.length)

    if (sanitizedContent.length < 10) {
      return NextResponse.json({ error: "Dokument ist zu kurz oder leer" }, { status: 400 })
    }

    // Create Supabase client
    console.log("[v0] Step 3: Creating Supabase client...")
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    console.log("[v0] Step 4: Inserting document (fire-and-forget)...")
    const documentId = crypto.randomUUID()

    // Insert without waiting for .select()
    const insertPromise = supabase.from("documents").insert({
      id: documentId,
      title,
      content: sanitizedContent.substring(0, 50000), // Limit content size
      file_type: fileType || "text/plain",
    })

    // Don't await yet - continue with chunking
    console.log("[v0] Document ID:", documentId)

    // Create chunks
    console.log("[v0] Step 5: Creating chunks (1000 chars, 200 overlap)...")
    const chunks = chunkText(sanitizedContent, 1000, 200)
    console.log("[v0] Created", chunks.length, "chunks")

    if (chunks.length === 0) {
      return NextResponse.json({ error: "Keine Chunks konnten erstellt werden" }, { status: 400 })
    }

    // Now wait for document insert
    const { error: insertError } = await insertPromise
    if (insertError) {
      console.error("[v0] Document insert error:", insertError)
      return NextResponse.json({ error: `Datenbankfehler: ${insertError.message}` }, { status: 500 })
    }
    console.log("[v0] Document inserted successfully")

    // Generate embeddings in batches of 10
    console.log("[v0] Step 6: Generating embeddings in batches of 10...")
    const BATCH_SIZE = 10
    const allChunkData: Array<{
      document_id: string
      chunk_text: string
      chunk_index: number
      embedding: number[]
    }> = []

    let successfulBatches = 0
    let failedBatches = 0
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE)
      const batchTexts = batchChunks.map((chunk) => sanitizeText(chunk.text))
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1

      try {
        const embeddings = await generateBatchEmbeddingsWithTimeout(batchTexts, batchNumber, totalBatches)

        for (let j = 0; j < batchChunks.length; j++) {
          allChunkData.push({
            document_id: documentId,
            chunk_text: sanitizeText(batchChunks[j].text),
            chunk_index: batchChunks[j].index,
            embedding: embeddings[j],
          })
        }
        successfulBatches++
      } catch (error) {
        console.error(`[v0] Batch ${batchNumber} failed:`, error)
        failedBatches++
        // Continue with other batches instead of failing completely
      }
    }

    console.log(`[v0] Embedding generation complete: ${successfulBatches}/${totalBatches} batches successful`)

    if (allChunkData.length === 0) {
      return NextResponse.json(
        {
          error: "Keine Embeddings konnten generiert werden. Bitte versuchen Sie es erneut.",
        },
        { status: 500 },
      )
    }

    // Insert chunks with embeddings
    console.log("[v0] Step 7: Inserting", allChunkData.length, "chunks into database...")
    const { error: chunksError } = await supabase.from("document_chunks").insert(allChunkData)

    if (chunksError) {
      console.error("[v0] Chunks insert error:", chunksError)
      return NextResponse.json({ error: `Chunk-Speicherung fehlgeschlagen: ${chunksError.message}` }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[v0] ========== UPLOAD COMPLETE (${duration}ms) ==========`)

    return NextResponse.json({
      success: true,
      message:
        failedBatches > 0
          ? `Dokument "${title}" hochgeladen (${successfulBatches}/${totalBatches} Batches erfolgreich)`
          : `Dokument "${title}" erfolgreich hochgeladen und verarbeitet`,
      document: {
        id: documentId,
        title: title,
        chunks: allChunkData.length,
        totalChunks: chunks.length,
      },
      stats: {
        duration: `${duration}ms`,
        batches: { successful: successfulBatches, failed: failedBatches, total: totalBatches },
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[v0] Upload failed after ${duration}ms:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Hochladen" },
      { status: 500 },
    )
  }
}
