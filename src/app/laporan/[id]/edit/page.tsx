import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EditForm } from "./EditForm"

type Props = { params: Promise<{ id: string }> }

export default async function EditPage({ params }: Props) {
  const { id } = await params
  const submission = await prisma.submission.findUnique({
    where: { id: Number(id) },
    include: {
      iku:   { orderBy: { urutan: "asc" } },
      files: { orderBy: { uploadedAt: "asc" } },
    },
  })
  if (!submission) notFound()

  // Serialisasi Date → string agar bisa dikirim ke Client Component
  const data = {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    files: submission.files.map((f) => ({
      id:            f.id,
      originalName:  f.originalName,
      sizeBytes:     f.sizeBytes,
      cloudinaryUrl: f.cloudinaryUrl,
    })),
    iku: submission.iku.map((i) => ({
      id:                  i.id,
      urutan:              i.urutan,
      nama_iku:            i.nama_iku,
      satuan:              i.satuan,
      pagu:                i.pagu,
      target_2026:         i.target_2026,
      target_tw:           i.target_tw,
      realisasi_output:    i.realisasi_output,
      realisasi_keuangan:  i.realisasi_keuangan,
      pct_capaian:         i.pct_capaian,
      keterangan:          i.keterangan,
      permasalahan:        i.permasalahan,
      tindak_lanjut:       i.tindak_lanjut,
      faktor_keberhasilan: i.faktor_keberhasilan,
    })),
  }

  return <EditForm initialData={data} />
}
