// Text extraction utilities for different file types

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type || getFileTypeFromName(file.name)

  if (fileType === "text/plain" || file.name.endsWith(".txt")) {
    return await file.text()
  }

  if (fileType === "application/pdf" || file.name.endsWith(".pdf")) {
    return await extractTextFromPDF(file)
  }

  if (fileType === "text/markdown" || file.name.endsWith(".md")) {
    return await file.text()
  }

  // For other text-based files, try to read as text
  if (fileType.startsWith("text/")) {
    return await file.text()
  }

  throw new Error(`Nicht unterstützter Dateityp: ${fileType}`)
}

function getFileTypeFromName(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    txt: "text/plain",
    pdf: "application/pdf",
    md: "text/markdown",
    json: "application/json",
    csv: "text/csv",
  }

  return mimeTypes[ext || ""] || "application/octet-stream"
}

async function extractTextFromPDF(file: File): Promise<string> {
  // For PDF files, we'll use a simple text extraction
  // In production, you'd use pdf-parse or similar
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // Simple text extraction from PDF (very basic)
  // This won't work for complex PDFs - you'd need a proper PDF parser
  let text = ""
  for (let i = 0; i < uint8Array.length; i++) {
    const char = uint8Array[i]
    if (char >= 32 && char <= 126) {
      text += String.fromCharCode(char)
    }
  }

  // Clean up the extracted text
  text = text.replace(/\s+/g, " ").trim()

  if (text.length < 100) {
    throw new Error("PDF-Text konnte nicht extrahiert werden. Bitte verwenden Sie eine TXT-Datei.")
  }

  return text
}

export function validateFileSize(file: File, maxSizeMB = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxBytes
}

export function getSupportedFileTypes(): string[] {
  return [".txt", ".pdf", ".md", ".json", ".csv"]
}
