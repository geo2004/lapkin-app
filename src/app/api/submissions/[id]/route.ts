import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/cloudinary"

// ── PUT /api/submissions/[id] ──────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const submissionId = Number(id)

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { iku: true, files: true },
  })
  if (!submission) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })

  const body = await req.json()
  const {
    pengisi, jabatan, status, link_datadukung,
    iku = [] as IKUInput[],
    fileIds = [] as string[],
    deleteFileIds = [] as string[],
  } = body

  // 1. Update field identitas submission
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      ...(pengisi !== undefined && { pengisi }),
      ...(jabatan !== undefined && { jabatan: jabatan || null }),
      ...(status  !== undefined && { status }),
      ...(link_datadukung !== undefined && { link_datadukung: link_datadukung || null }),
    },
  })

  // 2. Sinkron IKU: update existing, create new, delete yang tidak ada di payload
  const existingIds = submission.iku.map((i) => i.id)
  const payloadIds  = (iku as IKUInput[]).filter((i) => i.id).map((i) => i.id as number)
  const toDeleteIds = existingIds.filter((id) => !payloadIds.includes(id))

  if (toDeleteIds.length > 0) {
    await prisma.iKU.deleteMany({ where: { id: { in: toDeleteIds } } })
  }

  for (const item of iku as IKUInput[]) {
    const data = {
      urutan:              item.urutan,
      nama_iku:            item.nama_iku,
      satuan:              item.satuan ?? "",
      pagu:                Number(item.pagu) || 0,
      target_2026:         Number(item.target_2026) || 0,
      target_tw:           Number(item.target_tw) || 0,
      realisasi_output:    Number(item.realisasi_output) || 0,
      realisasi_keuangan:  Number(item.realisasi_keuangan) || 0,
      pct_capaian:         item.pct_capaian || "—",
      keterangan:          item.keterangan || "",
      permasalahan:        item.permasalahan || "",
      tindak_lanjut:       item.tindak_lanjut || "",
      faktor_keberhasilan: item.faktor_keberhasilan || "",
    }
    if (item.id) {
      await prisma.iKU.update({ where: { id: item.id }, data })
    } else {
      await prisma.iKU.create({ data: { submissionId, ...data } })
    }
  }

  // 3. Hapus file yang di-mark untuk dihapus
  const filesToDelete = submission.files.filter((f) => deleteFileIds.includes(f.id))
  for (const f of filesToDelete) await deleteFile(f.cloudinaryPublicId)
  if (filesToDelete.length > 0) {
    await prisma.uploadedFile.deleteMany({ where: { id: { in: filesToDelete.map((f) => f.id) } } })
  }

  // 4. Link file baru ke submission
  if (fileIds.length > 0) {
    await prisma.uploadedFile.updateMany({
      where: { id: { in: fileIds }, submissionId: null },
      data: { submissionId },
    })
  }

  const updated = await prisma.submission.findUnique({ where: { id: submissionId } })
  return NextResponse.json({ id: submissionId, status: updated?.status })
}

interface IKUInput {
  id?: number
  urutan: number
  nama_iku: string
  satuan?: string
  pagu: number
  target_2026: number
  target_tw: number
  realisasi_output: number
  realisasi_keuangan: number
  pct_capaian: string
  keterangan: string
  permasalahan: string
  tindak_lanjut: string
  faktor_keberhasilan: string
}

// ── GET /api/submissions/[id] ─────────────────────────────────────────────────
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
