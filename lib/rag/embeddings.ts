/**
 * Generate embeddings using OpenAI API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const maxChars = 6000 // Safe limit, well under 8192 tokens
  if (text.length > maxChars) {
    console.warn(`[v0] Text too long (${text.length} chars), truncating to ${maxChars}`)
    text = text.slice(0, maxChars)
  }

  console.log(`[v0] Generating embedding for text of length: ${text.length}`)

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("[v0] OpenAI API error:", errorData)
    throw new Error(`Embedding generation failed: ${errorData.error?.message || "Unknown error"}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Generate embeddings for multiple texts in a single API call
 * OpenAI allows up to 2048 inputs per request
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const maxChars = 6000
  const processedTexts = texts.map((text) => {
    if (text.length > maxChars) {
      console.warn(`[v0] Text too long (${text.length} chars), truncating to ${maxChars}`)
      return text.slice(0, maxChars)
    }
    return text
  })

  console.log(`[v0] Generating ${processedTexts.length} embeddings in batch`)

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set")
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: processedTexts,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OpenAI API error response:", response.status, errorText)
      throw new Error(`Embedding generation failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`[v0] Successfully generated ${data.data.length} embeddings`)
    return data.data.map((item: any) => item.embedding)
  } catch (error) {
    console.error("[v0] Fetch error in generateBatchEmbeddings:", error)
    throw error
  }
}

/**
 * Generate a mock embedding for demo purposes
 * This creates a deterministic vector based on text content
 */
function generateMockEmbedding(text: string): number[] {
  const dimension = 1536
  const embedding = new Array(dimension)

  // Create a simple hash-based embedding
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash = hash & hash
  }

  // Use the hash to seed a pseudo-random generator
  const seed = Math.abs(hash)
  let random = seed

  for (let i = 0; i < dimension; i++) {
    random = (random * 9301 + 49297) % 233280
    embedding[i] = (random / 233280) * 2 - 1 // Normalize to [-1, 1]
  }

  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map((val) => val / magnitude)
}
