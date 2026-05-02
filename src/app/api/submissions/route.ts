import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/cloudinary"

// ── GET /api/submissions ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const satker   = searchParams.get("satker")   ?? undefined
  const unit     = searchParams.get("unit")     ?? undefined
  const triwulan = searchParams.get("triwulan") ?? undefined
  const status   = searchParams.get("status")   ?? undefined
  const tahun    = searchParams.get("tahun")    ? Number(searchParams.get("tahun")) : undefined
  const page     = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")))

  const where = {
    ...(satker   && { kode_satker:     satker   }),
    ...(unit     && { unit_kerja_kode: unit     }),
    ...(triwulan && { triwulan                  }),
    ...(status   && { status                    }),
    ...(tahun    && { tahun                     }),
  }

  const [total, rows] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { iku: true, files: true } },
        iku: { select: { pagu: true, realisasi_keuangan: true } },
      },
    }),
  ])

  const data = rows.map((r) => {
    const totalPagu = r.iku.reduce((s, i) => s + i.pagu, 0)
    const totalRealKeu = r.iku.reduce((s, i) => s + i.realisasi_keuangan, 0)
    const pctSerapan = totalPagu > 0 ? ((totalRealKeu / totalPagu) * 100).toFixed(1) + "%" : "—"
    const { iku: _iku, ...rest } = r
    return { ...rest, totalPagu, totalRealKeu, pctSerapan }
  })

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

// ── POST /api/submissions ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      kode_satker, nama_satker, wilayah, tahun = 2026, triwulan,
      unit_kerja_kode, unit_kerja_nama, pengisi, jabatan,
      status = "DRAFT", link_datadukung,
      fileIds = [] as string[],
      iku = [] as IKUInput[],
    } = body

    if (!kode_satker || !triwulan || !unit_kerja_kode) {
      return NextResponse.json({ error: "Satker dan unit kerja wajib dipilih" }, { status: 400 })
    }

    // Hapus submission lama (upsert manual)
    const existing = await prisma.submission.findFirst({
      where: { kode_satker, unit_kerja_kode, triwulan, tahun },
      include: { files: true },
    })

    if (existing) {
      for (const f of existing.files) await deleteFile(f.cloudinaryPublicId)
      await prisma.submission.delete({ where: { id: existing.id } })
    }

    // Buat submission baru
    const submission = await prisma.submission.create({
      data: {
        kode_satker, nama_satker, wilayah, tahun, triwulan,
        unit_kerja_kode, unit_kerja_nama, pengisi,
        jabatan: jabatan || null,
        status, link_datadukung: link_datadukung || null,
        iku: {
          create: iku.map((item: IKUInput) => ({
            urutan: item.urutan,
            nama_iku: item.nama_iku,
            pagu: Number(item.pagu) || 0,
            target_2026: Number(item.target_2026) || 0,
            target_tw: Number(item.target_tw) || 0,
            realisasi_output: Number(item.realisasi_output) || 0,
            realisasi_keuangan: Number(item.realisasi_keuangan) || 0,
            pct_capaian: item.pct_capaian || "—",
            keterangan: item.keterangan || "",
            permasalahan: item.permasalahan || "",
            tindak_lanjut: item.tindak_lanjut || "",
            faktor_keberhasilan: item.faktor_keberhasilan || "",
          })),
        },
      },
    })

    // Link file ke submission
    if (fileIds.length > 0) {
      await prisma.uploadedFile.updateMany({
        where: { id: { in: fileIds }, submissionId: null },
        data: { submissionId: submission.id },
      })
    }

    return NextResponse.json({ id: submission.id, status: submission.status }, { status: 201 })
  } catch (err) {
    console.error("Submit error:", err)
    return NextResponse.json({ error: "Gagal menyimpan laporan" }, { status: 500 })
  }
}

interface IKUInput {
  urutan: number
  nama_iku: string
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
