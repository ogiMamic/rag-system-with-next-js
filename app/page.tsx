import { Suspense } from "react"
import { RAGInterface } from "@/components/rag-interface"
import { DocumentList } from "@/components/document-list"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900">RAG Knowledge System</h1>
          <p className="mx-auto max-w-2xl text-balance text-lg text-slate-600">
            Laden Sie Ihre Dokumente hoch und stellen Sie Fragen. Das System nutzt Retrieval-Augmented Generation für
            präzise Antworten.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
              <RAGInterface />
            </Suspense>
          </div>

          <div>
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
              <DocumentList />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
