import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/cloudinary"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const submission = await prisma.submission.findUnique({
    where: { id: Number(id) },
    include: {
      iku: { orderBy: { urutan: "asc" } },
      files: { orderBy: { uploadedAt: "asc" } },
    },
  })
  if (!submission) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })
  return NextResponse.json(submission)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const submission = await prisma.submission.findUnique({
    where: { id: Number(id) },
    include: { files: true },
  })
  if (!submission) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })

  for (const f of submission.files) await deleteFile(f.cloudinaryPublicId)
  await prisma.submission.delete({ where: { id: Number(id) } })

  return new NextResponse(null, { status: 204 })
}
