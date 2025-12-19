/**
 * Split text into chunks for better retrieval
 * OpenAI text-embedding-3-small has a limit of 8192 tokens
 * We use ~1000 characters per chunk to stay well under the limit
 */
export interface Chunk {
  text: string
  index: number
}

export function chunkText(text: string, chunkSize = 1000, overlap = 200): Chunk[] {
  const chunks: Chunk[] = []

  // Split by characters instead of words to have better control over size
  let start = 0
  let chunkIndex = 0

  while (start < text.length) {
    // Get chunk of specified size
    let end = Math.min(start + chunkSize, text.length)

    // Try to break at sentence or word boundary if not at the end
    if (end < text.length) {
      // Look for sentence end (. ! ?)
      const sentenceEnd = text.lastIndexOf(".", end)
      const exclamationEnd = text.lastIndexOf("!", end)
      const questionEnd = text.lastIndexOf("?", end)
      const maxSentenceEnd = Math.max(sentenceEnd, exclamationEnd, questionEnd)

      if (maxSentenceEnd > start + chunkSize * 0.5) {
        // If we found a sentence boundary in the latter half, use it
        end = maxSentenceEnd + 1
      } else {
        // Otherwise, try to break at word boundary
        const spaceEnd = text.lastIndexOf(" ", end)
        if (spaceEnd > start + chunkSize * 0.5) {
          end = spaceEnd
        }
      }
    }

    const chunkText = text.slice(start, end).trim()

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        index: chunkIndex++,
      })
    }

    // Move start position with overlap
    start = end - overlap
    if (start <= 0) start = end
  }

  console.log(`[v0] Created ${chunks.length} chunks from ${text.length} characters`)
  chunks.forEach((chunk, idx) => {
    console.log(`[v0] Chunk ${idx}: ${chunk.text.length} characters`)
  })

  return chunks
}
