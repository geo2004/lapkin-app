import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildLapkinWorkbook } from "@/lib/exportExcel"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const satker   = searchParams.get("satker")   ?? undefined
  const unit     = searchParams.get("unit")     ?? undefined
  const triwulan = searchParams.get("triwulan") ?? undefined
  const status   = searchParams.get("status")   ?? undefined
  const tahun    = searchParams.get("tahun")    ? Number(searchParams.get("tahun")) : undefined

  const where = {
    ...(satker   && { kode_satker:     satker   }),
    ...(unit     && { unit_kerja_kode: unit     }),
    ...(triwulan && { triwulan                  }),
    ...(status   && { status                    }),
    ...(tahun    && { tahun                     }),
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: [{ triwulan: "asc" }, { unit_kerja_kode: "asc" }, { createdAt: "asc" }],
    include: {
      iku: { orderBy: { urutan: "asc" } },
      files: { select: { id: true, originalName: true, sizeBytes: true } },
    },
  })

  const buffer = await buildLapkinWorkbook(submissions)

  const today = new Date().toISOString().slice(0, 10)
  const label = [satker, unit, triwulan, status].filter(Boolean).join("_") || "semua"
  const filename = `Lapkin_BP3KP_${label}_${today}.xlsx`

  return new NextResponse(Buffer.from(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
