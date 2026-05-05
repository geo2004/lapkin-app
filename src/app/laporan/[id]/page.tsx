import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

const UNIT_COLORS: Record<string, { color: string; bg: string }> = {
  SETJEN: { color: "#0969da", bg: "#ddf4ff" },
  DJKP:  { color: "#1a7f37", bg: "#dcfce7" },
  DJPP:  { color: "#6639ba", bg: "#fbefff" },
  DJPK:  { color: "#1b7c83", bg: "#d8f3f6" },
  DJTK:  { color: "#9a6700", bg: "#fff8c5" },
}

function card(children: React.ReactNode, mb = 16) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--line)",
      borderRadius: 12, overflow: "hidden", marginBottom: mb,
    }}>
      {children}
    </div>
  )
}

function cardHead(title: string, sub?: string) {
  return (
    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line2)" }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--ink3)" }}>{sub}</div>}
    </div>
  )
}

function kv(label: string, value: React.ReactNode) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink3)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString("id-ID")
}

type Props = { params: Promise<{ id: string }> }

export default async function LaporanDetailPage({ params }: Props) {
  const { id } = await params
  const submission = await prisma.submission.findUnique({
    where: { id: Number(id) },
    include: {
      iku: { orderBy: { urutan: "asc" } },
      files: { orderBy: { uploadedAt: "asc" } },
    },
  })

  if (!submission) notFound()

  const uc = UNIT_COLORS[submission.unit_kerja_kode] ?? { color: "var(--ink3)", bg: "var(--line2)" }
  const isFinal = submission.status === "FINAL"
  const totalPagu = submission.iku.reduce((s, i) => s + i.pagu, 0)
  const totalRealKeu = submission.iku.reduce((s, i) => s + i.realisasi_keuangan, 0)
  const pctSerapan = totalPagu > 0 ? ((totalRealKeu / totalPagu) * 100).toFixed(1) + "%" : "—"

  return (
    <div>
      {/* TOPBAR */}
      <div style={{
        background: "var(--pkp-teal)", color: "white", padding: "0 24px",
        height: 56, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200,
        borderBottom: "3px solid var(--pkp-gold)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/logo_pkp.png" alt="Logo PKP" style={{ height: 32, objectFit: "contain" }} />
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.25)" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.01em", lineHeight: 1.2 }}>
              Detail Laporan #{submission.id}
            </div>
            <div className="topbar-subtitle-hide" style={{ fontSize: 10, opacity: 0.65 }}>BP3KP Jawa III · Kinerja Triwulanan 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`/laporan/${submission.id}/edit`} style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
            padding: "3px 10px", borderRadius: 4,
            background: "var(--pkp-gold)", color: "var(--pkp-teal-dark)",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
            border: "none",
          }}>
            <i className="fa-solid fa-pen" style={{ fontSize: 9 }}></i> Edit
          </a>
          <a href="/dashboard" style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 500,
            padding: "3px 10px", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
          }}>
            <i className="fa-solid fa-arrow-left" style={{ fontSize: 9 }}></i> Dashboard
          </a>
        </div>
      </div>

      <div className="detail-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{submission.nama_satker}</h1>
            <span style={{
              background: isFinal ? "var(--green-bg)" : "var(--amber-bg)",
              color: isFinal ? "var(--green)" : "var(--amber)",
              borderRadius: 20, padding: "3px 11px",
              fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)",
            }}>
              {submission.status}
            </span>
          </div>
          <div style={{ color: "var(--ink3)", fontSize: 13 }}>
            <span style={{ fontFamily: "var(--mono)" }}>{submission.kode_satker}</span>
            {" · "}{submission.triwulan} {submission.tahun}
            {" · "}{submission.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* IDENTITAS */}
        {card(
          <>
            {cardHead("Identitas")}
            <div className="grid-3col" style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {kv("Unit Kerja", (
                <span style={{
                  background: uc.bg, color: uc.color,
                  borderRadius: 5, padding: "2px 8px",
                  fontSize: 12, fontWeight: 700,
                }}>
                  {submission.unit_kerja_kode} — {submission.unit_kerja_nama}
                </span>
              ))}
              {kv("Pengisi", submission.pengisi)}
              {kv("Jabatan / NIP", submission.jabatan ?? "—")}
              {kv("Total Pagu", `Rp ${fmt(totalPagu)}`)}
              {kv("Total Real. Keuangan", `Rp ${fmt(totalRealKeu)}`)}
              {kv("% Serapan", pctSerapan)}
            </div>
          </>
        )}

        {/* IKU */}
        {card(
          <>
            {cardHead("Capaian IKU", `${submission.iku.length} indikator`)}
            <div style={{ padding: "16px 20px" }}>
              {submission.iku.map((iku) => (
                <div key={iku.id} style={{
                  border: "1px solid var(--line)", borderRadius: 9, overflow: "hidden", marginBottom: 12,
                }}>
                  <div style={{
                    background: "var(--line2)", padding: "8px 14px",
                    borderBottom: "1px solid var(--line)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{
                      width: 22, height: 22, background: "var(--pkp-teal)", color: "white",
                      borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                    }}>
                      {iku.urutan}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{iku.nama_iku}</span>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div className="grid-5col" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 12 }}>
                      {[
                        ["Satuan", iku.satuan || "—"],
                        ["Pagu", `Rp ${fmt(iku.pagu)}`],
                        ["Target 2026", iku.target_2026],
                        ["Target TW", iku.target_tw],
                        ["Realisasi Output", iku.realisasi_output],
                        ["% Capaian", iku.pct_capaian],
                      ].map(([l, v]) => (
                        <div key={String(l)}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink3)", marginBottom: 2 }}>{l}</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {iku.keterangan && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ink3)", marginBottom: 3 }}>Keterangan Kegiatan</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{iku.keterangan}</div>
                      </div>
                    )}
                    {iku.permasalahan && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--red)", marginBottom: 3 }}>Permasalahan</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{iku.permasalahan}</div>
                      </div>
                    )}
                    {iku.tindak_lanjut && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--amber)", marginBottom: 3 }}>Tindak Lanjut</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{iku.tindak_lanjut}</div>
                      </div>
                    )}
                    {iku.faktor_keberhasilan && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--green)", marginBottom: 3 }}>Faktor Keberhasilan</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{iku.faktor_keberhasilan}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FILES */}
        {card(
          <>
            {cardHead("Data Dukung", `${submission.files.length} file`)}
            <div style={{ padding: "16px 20px" }}>
              {submission.link_datadukung && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "var(--ink3)" }}>Link: </span>
                  <a href={submission.link_datadukung} target="_blank" style={{ color: "var(--navy)", fontSize: 13 }}>
                    {submission.link_datadukung}
                  </a>
                </div>
              )}
              {submission.files.length === 0 && !submission.link_datadukung && (
                <div style={{ color: "var(--ink3)", fontSize: 13 }}>Tidak ada file terlampir</div>
              )}
              {submission.files.map((f) => {
                const ext = f.originalName.split(".").pop()?.toUpperCase() ?? "FILE"
                const size = f.sizeBytes < 1024 * 1024
                  ? (f.sizeBytes / 1024).toFixed(0) + " KB"
                  : (f.sizeBytes / 1024 / 1024).toFixed(1) + " MB"
                return (
                  <div key={f.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "var(--line2)", border: "1px solid var(--line)",
                    borderRadius: 7, padding: "8px 12px", marginBottom: 6, fontSize: 12,
                  }}>
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700,
                      background: "var(--amber-bg)", color: "var(--amber)",
                      padding: "2px 5px", borderRadius: 3,
                    }}>
                      {ext}
                    </span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{f.originalName}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink3)" }}>{size}</span>
                    <a href={`/api/uploads/${f.id}`}
                      style={{
                        background: "var(--navy-bg)", color: "var(--navy)",
                        border: "1px solid var(--navy)33", borderRadius: 5,
                        padding: "3px 9px", fontSize: 11, fontWeight: 600,
                        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                      <i className="fa-solid fa-download" style={{ fontSize: 10 }}></i> Download
                    </a>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
