import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { StatCards } from "@/components/dashboard/StatCards"
import { FilterBar } from "@/components/dashboard/FilterBar"
import { SubmissionsTable } from "@/components/dashboard/SubmissionsTable"

type SearchParams = Promise<{
  satker?: string; unit?: string; triwulan?: string
  status?: string; tahun?: string; page?: string
}>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const page  = Math.max(1, Number(sp.page ?? "1"))
  const limit = 50

  const where = {
    ...(sp.satker   && { kode_satker:     sp.satker   }),
    ...(sp.unit     && { unit_kerja_kode: sp.unit     }),
    ...(sp.triwulan && { triwulan:        sp.triwulan }),
    ...(sp.status   && { status:          sp.status   }),
    ...(sp.tahun    && { tahun:           Number(sp.tahun) }),
  }

  const [total, byStatus, satkerList, rows] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.groupBy({ by: ["status"], _count: { id: true }, where }),
    prisma.submission.findMany({ where, select: { kode_satker: true }, distinct: ["kode_satker"] }),
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

  const finalCount = byStatus.find((b) => b.status === "FINAL")?._count.id ?? 0
  const draftCount = byStatus.find((b) => b.status === "DRAFT")?._count.id ?? 0
  const totalPages = Math.ceil(total / limit)

  const tableRows = rows.map((r) => {
    const totalPagu    = r.iku.reduce((s, i) => s + i.pagu, 0)
    const totalRealKeu = r.iku.reduce((s, i) => s + i.realisasi_keuangan, 0)
    const pctSerapan   = totalPagu > 0 ? ((totalRealKeu / totalPagu) * 100).toFixed(1) + "%" : "—"
    const { iku: _iku, ...rest } = r
    return { ...rest, totalPagu, totalRealKeu, pctSerapan, createdAt: rest.createdAt.toISOString() }
  })

  const exportParams = new URLSearchParams()
  if (sp.satker)   exportParams.set("satker",   sp.satker)
  if (sp.unit)     exportParams.set("unit",     sp.unit)
  if (sp.triwulan) exportParams.set("triwulan", sp.triwulan)
  if (sp.status)   exportParams.set("status",   sp.status)
  const exportUrl = `/api/export/excel?${exportParams.toString()}`

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── TOPBAR ── */}
      <div style={{
        background: "var(--pkp-teal)", color: "white",
        padding: "0 28px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 200,
        borderBottom: "3px solid var(--pkp-gold)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/logo_pkp.png" alt="Logo PKP" style={{ height: 36, objectFit: "contain" }} />
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.25)" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", lineHeight: 1.2 }}>
              BP3KP Jawa III
            </div>
            <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, letterSpacing: "0.03em" }}>
              Laporan Kinerja Triwulanan 2026
            </div>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/design/image6.png" alt="Kementerian PKP" style={{ height: 40, objectFit: "contain" }} />
      </div>

      {/* ── HERO SECTION ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--pkp-teal-dark) 0%, var(--pkp-teal) 100%)",
        padding: "36px 28px 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Eyebrow */}
          <div style={{
            fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500,
            color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 10,
          }}>
            Sistem Pemantauan Pengisian
          </div>

          {/* Judul + tombol dalam satu baris */}
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between", gap: 24, flexWrap: "wrap",
          }}>
            <div>
              <h1 style={{
                fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800,
                color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.02em",
                marginBottom: 6,
              }}>
                Laporan Kinerja<br />
                <span style={{ color: "#fbbf24" }}>Triwulanan 2026</span>
              </h1>
              <p style={{
                fontSize: 13, color: "rgba(255,255,255,0.6)",
                lineHeight: 1.6, maxWidth: 420,
              }}>
                Pantau progress pengisian laporan semua satker dan unit kerja secara real-time.
              </p>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
              <a href="/form" target="_blank" className="btn-ghost-white" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                borderRadius: 40, padding: "12px 24px",
                fontSize: 14, fontWeight: 700, color: "#ffffff",
                textDecoration: "none", letterSpacing: "0.01em",
                backdropFilter: "blur(4px)",
              }}
              >
                <i className="fa-solid fa-pen-to-square" style={{ fontSize: 14 }}></i>
                Isi Formulir
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 11, opacity: 0.7 }}></i>
              </a>

              <a href={exportUrl} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--pkp-gold)",
                border: "1.5px solid var(--pkp-gold-dark)",
                borderRadius: 40, padding: "12px 28px",
                fontSize: 14, fontWeight: 700, color: "var(--pkp-teal)",
                textDecoration: "none", letterSpacing: "0.01em",
                boxShadow: "0 4px 16px rgba(213,198,139,0.4)",
              }}>
                <i className="fa-solid fa-table" style={{ fontSize: 14 }}></i>
                Export Excel
                <i className="fa-solid fa-download" style={{ fontSize: 11, opacity: 0.8 }}></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px 80px" }}>

        {/* Stat Cards */}
        <StatCards
          total={total}
          finalCount={finalCount}
          draftCount={draftCount}
          satkerAktif={satkerList.length}
        />

        {/* Filter */}
        <div style={{
          background: "var(--white)", border: "1px solid var(--line)",
          borderRadius: 12, padding: "16px 20px", marginBottom: 16,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "var(--ink3)", marginBottom: 10,
          }}>
            Filter
          </div>
          <Suspense>
            <FilterBar />
          </Suspense>
        </div>

        {/* Table */}
        <Suspense>
          <SubmissionsTable rows={tableRows} total={total} page={page} totalPages={totalPages} />
        </Suspense>
      </div>
    </div>
  )
}
