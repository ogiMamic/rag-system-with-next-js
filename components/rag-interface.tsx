"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, MessageSquare, Loader2, FileText, CheckCircle, File, Trash2, Database } from "lucide-react"
import { extractTextFromFile, validateFileSize } from "@/lib/rag/text-extraction-client"

interface QueryResult {
  answer: string
  sources: Array<{
    chunk_text: string
    documents?: { title: string }
  }>
  note?: string
}

interface Document {
  id: string
  title: string
  file_type: string
  content: string
  created_at: string
}

export function RAGInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const [question, setQuestion] = useState("")
  const [querying, setQuerying] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true)
      const response = await fetch("/api/documents")
      if (!response.ok) throw new Error("Failed to fetch documents")
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("[v0] Fetch documents error:", error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Möchten Sie dieses Dokument wirklich löschen?")) return

    try {
      setDeletingId(documentId)
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      // Refresh documents list
      await fetchDocuments()
    } catch (error) {
      console.error("[v0] Delete error:", error)
      alert("Fehler beim Löschen des Dokuments")
    } finally {
      setDeletingId(null)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    setUploadSuccess(false)

    try {
      if (!validateFileSize(selectedFile, 10)) {
        throw new Error("Datei zu groß. Maximum 10MB erlaubt.")
      }

      console.log("[v0] Starting file upload:", selectedFile.name)
      console.log("[v0] Extracting text from file...")

      const extractedText = await extractTextFromFile(selectedFile)
      console.log("[v0] Extracted text length:", extractedText.length)

      if (extractedText.length < 10) {
        throw new Error("Dokument ist zu kurz oder leer")
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedFile.name,
          content: extractedText,
          fileType: selectedFile.type || "text/plain",
          customPrompt: customPrompt.trim() || undefined,
        }),
      })

      console.log("[v0] Upload response status:", response.status)

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        throw new Error("Server hat keine gültige JSON-Antwort zurückgegeben")
      }

      const data = await response.json()
      console.log("[v0] Upload response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setUploadSuccess(true)
      setSelectedFile(null)
      setCustomPrompt("")

      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      await fetchDocuments()

      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert(error instanceof Error ? error.message : "Fehler beim Hochladen des Dokuments")
    } finally {
      setUploading(false)
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuerying(true)
    setResult(null)

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) throw new Error("Query failed")

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("[v0] Query error:", error)
      alert("Fehler bei der Abfrage")
    } finally {
      setQuerying(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          RAG System Interface
        </CardTitle>
        <CardDescription className="text-blue-50">Dokumente hochladen und intelligente Fragen stellen</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="query" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="query" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Fragen stellen
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Dokument hochladen
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <Database className="h-4 w-4" />
              Wissensbasis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="mt-6">
            <form onSubmit={handleQuery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Ihre Frage</Label>
                <Textarea
                  id="question"
                  placeholder="z.B. Was sind die Hauptthemen in den Dokumenten?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-24 resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={querying || !question.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {querying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suche Antwort...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Frage stellen
                  </>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-blue-900">Antwort:</h3>
                  <p className="text-pretty text-slate-700">{result.answer}</p>
                  {result.note && <p className="mt-2 text-sm text-amber-600">{result.note}</p>}
                </div>

                {result.sources && result.sources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-700">Quellen:</h4>
                    {result.sources.map((source, idx) => (
                      <div key={idx} className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                        <p className="font-medium text-slate-900">{source.documents?.title || "Dokument"}</p>
                        <p className="mt-1 text-slate-600 line-clamp-2">{source.chunk_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Datei auswählen</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,.pdf,.md,.json,.csv"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1"
                    required
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2">
                      <File className="h-4 w-4 text-slate-600" />
                      <span className="text-sm text-slate-700">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500">Unterstützte Formate: TXT, PDF, MD, JSON, CSV (max. 10MB)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-prompt">Spezielle Anweisungen (Optional)</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="z.B. Extrahiere nur technische Informationen, Fokussiere auf Arbeitserfahrung, etc."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-20 resize-none"
                />
                <p className="text-sm text-slate-500">
                  Geben Sie spezifische Anweisungen, wie das Dokument verarbeitet werden soll
                </p>
              </div>

              <Button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird hochgeladen...
                  </>
                ) : uploadSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Erfolgreich hochgeladen!
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Dokument hochladen
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Hochgeladene Dokumente</h3>
                <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loadingDocuments}>
                  {loadingDocuments ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aktualisieren"}
                </Button>
              </div>

              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
                  <Database className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-600">Keine Dokumente vorhanden</p>
                  <p className="text-xs text-slate-500">Laden Sie Ihr erstes Dokument hoch, um zu beginnen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-slate-900">{doc.title}</h4>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                          <span>{doc.file_type?.toUpperCase() || "FILE"}</span>
                          <span>{new Date(doc.created_at).toLocaleDateString("de-DE")}</span>
                          <span>{(doc.content.length / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
