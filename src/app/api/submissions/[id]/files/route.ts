import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const files = await prisma.uploadedFile.findMany({
    where: { submissionId: Number(id) },
    select: { id: true, originalName: true, sizeBytes: true, mimeType: true, uploadedAt: true },
    orderBy: { uploadedAt: "asc" },
  })
  return NextResponse.json({ files })
}
