import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadFile } from "@/lib/cloudinary"
import { v4 as uuidv4 } from "uuid"

// GET /api/uploads — list recent uploads (needed for Vercel to register the route namespace)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const submissionId = searchParams.get("submissionId")
  const files = await prisma.uploadedFile.findMany({
    where: submissionId ? { submissionId: parseInt(submissionId) } : {},
    orderBy: { uploadedAt: "desc" },
    take: 50,
    select: { id: true, originalName: true, mimeType: true, sizeBytes: true, cloudinaryUrl: true, uploadedAt: true },
  })
  return NextResponse.json({ files })
}

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "audio/mpeg",
])

const MAX_SIZE = 100 * 1024 * 1024 // 100 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Tidak ada file" }, { status: 400 })

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: `Tipe file tidak diizinkan: ${file.type}` }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 100 MB" }, { status: 400 })
    }

    const fileId = uuidv4()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { publicId, url } = await uploadFile(buffer, fileId)

    await prisma.uploadedFile.create({
      data: {
        id: fileId,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        cloudinaryPublicId: publicId,
        cloudinaryUrl: url,
      },
    })

    return NextResponse.json({ fileId, originalName: file.name, sizeBytes: file.size }, { status: 201 })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Gagal mengupload file" }, { status: 500 })
  }
}
