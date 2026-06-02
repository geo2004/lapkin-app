import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/cloudinary"

export async function GET() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const orphans = await prisma.uploadedFile.findMany({
    where: { submissionId: null, uploadedAt: { lt: cutoff } },
  })

  for (const f of orphans) {
    await deleteFile(f.cloudinaryPublicId)
    await prisma.uploadedFile.delete({ where: { id: f.id } })
  }

  return NextResponse.json({ deleted: orphans.length })
}
