import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Delete document (chunks will be deleted automatically via CASCADE)
    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Dokument erfolgreich gelöscht" })
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete document" },
      { status: 500 },
    )
  }
}
