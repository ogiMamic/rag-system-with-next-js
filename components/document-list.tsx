"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar } from "lucide-react"

interface Document {
  id: string
  title: string
  file_type: string
  created_at: string
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("[v0] Fetch documents error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wissensbasis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded bg-slate-200" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Wissensbasis
        </CardTitle>
        <CardDescription className="text-emerald-50">
          {documents.length} Dokument{documents.length !== 1 ? "e" : ""} verfügbar
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {documents.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p className="text-sm">Noch keine Dokumente hochgeladen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-slate-900 line-clamp-2">{doc.title}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.created_at).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
