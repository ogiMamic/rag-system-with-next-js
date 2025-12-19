"use client"

// Client-side text extraction using PDF.js with CORS-friendly CDN

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist")

  // Set worker from unpkg CDN which has proper CORS headers
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()

  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const maxPages = pdf.numPages
    const textPromises = []

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const pagePromise = pdf.getPage(pageNum).then(async (page) => {
        const textContent = await page.getTextContent()
        return textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim()
      })
      textPromises.push(pagePromise)
    }

    const texts = await Promise.all(textPromises)
    return texts.join("\n").trim()
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error("Fehler beim Lesen der PDF-Datei")
  }
}

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

  if (fileType === "application/json" || file.name.endsWith(".json")) {
    return await file.text()
  }

  if (fileType === "text/csv" || file.name.endsWith(".csv")) {
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

export function validateFileSize(file: File, maxSizeMB = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxBytes
}
