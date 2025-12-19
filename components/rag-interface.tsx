"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Upload,
  MessageSquare,
  Loader2,
  FileText,
  CheckCircle,
  File,
  Trash2,
  Database,
  AlertCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
  Square,
  CheckSquare,
} from "lucide-react"
import { extractTextFromFile, validateFileSize } from "@/lib/rag/text-extraction-client"

interface QueryResult {
  answer: string
  sources: Array<{
    document_title: string
    chunk_text: string
    similarity: string
  }>
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
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [question, setQuestion] = useState("")
  const [querying, setQuerying] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [deletingMultiple, setDeletingMultiple] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const documentsTab = document.querySelector('[data-state="active"][value="knowledge"]')
        if (documentsTab && documents.length > 0) {
          e.preventDefault()
          setSelectedDocuments(new Set(documents.map((d) => d.id)))
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [documents])

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true)
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Fetch documents error:", error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Möchten Sie dieses Dokument wirklich löschen?")) return

    try {
      setDeletingId(documentId)
      const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" })
      if (response.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error("Delete error:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    setUploadMessage(null)

    try {
      if (!validateFileSize(selectedFile, 10)) {
        throw new Error("Datei zu groß. Maximum 10MB erlaubt.")
      }

      const extractedText = await extractTextFromFile(selectedFile)

      if (extractedText.length < 50) {
        throw new Error("Dokument ist zu kurz oder konnte nicht gelesen werden")
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedFile.name,
          content: extractedText,
          fileType: selectedFile.type || "text/plain",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload fehlgeschlagen")
      }

      setUploadMessage({
        type: "success",
        text: `Erfolgreich! "${selectedFile.name}" wurde mit ${data.chunks} Chunks verarbeitet.`,
      })
      setSelectedFile(null)

      const input = document.getElementById("file-upload") as HTMLInputElement
      if (input) input.value = ""

      await fetchDocuments()
    } catch (error) {
      setUploadMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Upload fehlgeschlagen",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setQuerying(true)
    setResult(null)
    setQueryError(null)
    setExpandedSources(new Set())

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Abfrage fehlgeschlagen")
      }

      setResult(data)
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : "Abfrage fehlgeschlagen")
    } finally {
      setQuerying(false)
    }
  }

  const toggleSource = (index: number) => {
    const newExpanded = new Set(expandedSources)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSources(newExpanded)
  }

  const getSimilarityColor = (similarity: string) => {
    const percent = Number.parseInt(similarity)
    if (percent >= 70) return "bg-green-100 text-green-700 border-green-200"
    if (percent >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200"
    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  const toggleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    setSelectedDocuments(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(documents.map((d) => d.id)))
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedDocuments.size === 0) return

    const count = selectedDocuments.size
    if (!confirm(`Möchten Sie wirklich ${count} Dokument${count > 1 ? "e" : ""} löschen?`)) return

    setDeletingMultiple(true)
    setDeleteMessage(null)

    try {
      let successCount = 0
      let failCount = 0

      for (const documentId of selectedDocuments) {
        try {
          const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" })
          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }

      setSelectedDocuments(new Set())
      await fetchDocuments()

      if (failCount === 0) {
        setDeleteMessage({
          type: "success",
          text: `${successCount} Dokument${successCount > 1 ? "e" : ""} erfolgreich gelöscht`,
        })
      } else {
        setDeleteMessage({
          type: "error",
          text: `${successCount} gelöscht, ${failCount} fehlgeschlagen`,
        })
      }

      setTimeout(() => setDeleteMessage(null), 3000)
    } catch (error) {
      setDeleteMessage({ type: "error", text: "Löschen fehlgeschlagen" })
    } finally {
      setDeletingMultiple(false)
    }
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          RAG Document Intelligence
        </CardTitle>
        <CardDescription className="text-blue-100">
          Laden Sie Dokumente hoch und stellen Sie intelligente Fragen
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="query" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100">
            <TabsTrigger value="query" className="gap-2 data-[state=active]:bg-white">
              <MessageSquare className="h-4 w-4" />
              Fragen
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-white">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2 data-[state=active]:bg-white">
              <Database className="h-4 w-4" />
              Dokumente ({documents.length})
            </TabsTrigger>
          </TabsList>

          {/* Query Tab */}
          <TabsContent value="query" className="mt-6">
            <form onSubmit={handleQuery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question" className="text-base font-semibold">
                  Ihre Frage
                </Label>
                <Textarea
                  id="question"
                  placeholder="z.B. Was sind die Hauptqualifikationen des Bewerbers? Welche Berufserfahrung hat die Person?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-28 text-base resize-none border-slate-200 focus:border-blue-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={querying || !question.trim()}
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {querying ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analysiere Dokumente...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Frage stellen
                  </>
                )}
              </Button>
            </form>

            {/* Query Error */}
            {queryError && (
              <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-red-700 font-medium">{queryError}</span>
                </div>
              </div>
            )}

            {/* Query Result - Improved answer display */}
            {result && (
              <div className="mt-6 space-y-4">
                {/* Answer Card */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg text-blue-900">KI-Antwort</h3>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{result.answer}</p>
                  </div>
                </div>

                {/* Sources - Expandable source cards */}
                {result.sources && result.sources.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-slate-600" />
                      <h4 className="font-semibold text-slate-700">Verwendete Quellen ({result.sources.length})</h4>
                    </div>

                    {result.sources.map((source, idx) => (
                      <Collapsible key={idx} open={expandedSources.has(idx)} onOpenChange={() => toggleSource(idx)}>
                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <span className="font-medium text-slate-900">{source.document_title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSimilarityColor(source.similarity)}`}
                                >
                                  {source.similarity} Relevanz
                                </span>
                                <ChevronDown
                                  className={`h-5 w-5 text-slate-400 transition-transform ${expandedSources.has(idx) ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 pt-0">
                              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 leading-relaxed">
                                {source.chunk_text}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-6">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-base font-semibold">
                  Datei auswählen
                </Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,.pdf,.md,.json,.csv"
                    onChange={(e) => {
                      setSelectedFile(e.target.files?.[0] || null)
                      setUploadMessage(null)
                    }}
                    className="border-0 p-0"
                    required
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Unterstützte Formate: PDF, TXT, MD, JSON, CSV (max. 10MB)
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                  <File className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="font-medium text-slate-900">{selectedFile.name}</span>
                    <span className="text-sm text-slate-500 ml-2">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verarbeite Dokument...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Dokument hochladen & analysieren
                  </>
                )}
              </Button>

              {/* Upload Message - Improved styling */}
              {uploadMessage && (
                <div
                  className={`rounded-xl p-4 border ${
                    uploadMessage.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${uploadMessage.type === "success" ? "bg-green-100" : "bg-red-100"}`}
                    >
                      {uploadMessage.type === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <span className={uploadMessage.type === "success" ? "text-green-700" : "text-red-700"}>
                      {uploadMessage.text}
                    </span>
                  </div>
                </div>
              )}
            </form>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="knowledge" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-lg text-slate-900">Wissensbasis</h3>
                  {documents.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {selectedDocuments.size === documents.length ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                      <span>Alle auswählen</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedDocuments.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteMultiple}
                      disabled={deletingMultiple}
                      className="gap-2"
                    >
                      {deletingMultiple ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Ausgewählte löschen ({selectedDocuments.size})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loadingDocuments}>
                    {loadingDocuments ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aktualisieren"}
                  </Button>
                </div>
              </div>

              {deleteMessage && (
                <div
                  className={`rounded-lg p-3 border ${
                    deleteMessage.type === "success"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {deleteMessage.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{deleteMessage.text}</span>
                  </div>
                </div>
              )}

              {loadingDocuments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <Database className="mx-auto h-16 w-16 text-slate-300" />
                  <p className="mt-4 text-lg font-medium text-slate-600">Keine Dokumente vorhanden</p>
                  <p className="text-sm text-slate-400 mt-1">Laden Sie Ihr erstes Dokument hoch</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                        selectedDocuments.has(doc.id)
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:shadow-md"
                      }`}
                      onClick={() => toggleSelectDocument(doc.id)}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectDocument(doc.id)
                          }}
                          className="flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          {selectedDocuments.has(doc.id) ? (
                            <CheckSquare className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Square className="h-6 w-6 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">{doc.title}</span>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span>{new Date(doc.created_at).toLocaleDateString("de-DE")}</span>
                            <span>•</span>
                            <span>{(doc.content?.length / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(doc.id)
                        }}
                        disabled={deletingId === doc.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {documents.length > 0 && (
                <p className="text-xs text-slate-400 text-center mt-4">Tipp: Strg+A zum Auswählen aller Dokumente</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
