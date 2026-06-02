import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  const record = await prisma.uploadedFile.findUnique({ where: { id: fileId } })
  if (!record) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 })

  return NextResponse.redirect(record.cloudinaryUrl)
}
