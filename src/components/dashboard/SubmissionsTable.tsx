"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Row = {
  id: number
  createdAt: string
  kode_satker: string
  nama_satker: string
  triwulan: string
  unit_kerja_kode: string
  unit_kerja_nama: string
  pengisi: string
  status: string
  totalPagu: number
  totalRealKeu: number
  pctSerapan: string
  _count: { iku: number; files: number }
}

const UNIT_COLORS: Record<string, { color: string; bg: string }> = {
  SETJEN: { color: "#0969da", bg: "#ddf4ff" },
  DJKP:  { color: "#1a7f37", bg: "#dcfce7" },
  DJPP:  { color: "#6639ba", bg: "#fbefff" },
  DJPK:  { color: "#1b7c83", bg: "#d8f3f6" },
  DJTK:  { color: "#9a6700", bg: "#fff8c5" },
}

function fmt(n: number) {
  if (n === 0) return "—"
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " M"
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " jt"
  if (n >= 1e3) return (n / 1e3).toFixed(0) + " rb"
  return n.toString()
}

type Props = { rows: Row[]; total: number; page: number; totalPages: number }

export function SubmissionsTable({ rows, total, page, totalPages }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  function goPage(p: number) {
    const params = new URLSearchParams(sp.toString())
    params.set("page", String(p))
    router.push(`/dashboard?${params.toString()}`)
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus laporan ini?")) return
    await fetch(`/api/submissions/${id}`, { method: "DELETE" })
    router.refresh()
  }

  const th: React.CSSProperties = {
    padding: "8px 12px", fontSize: 10, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.06em",
    color: "var(--ink3)", textAlign: "left", whiteSpace: "nowrap",
    borderBottom: "2px solid var(--line)",
  }
  const td: React.CSSProperties = {
    padding: "10px 12px", fontSize: 13, verticalAlign: "middle",
    borderBottom: "1px solid var(--line2)",
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 8 }}>
        Menampilkan {rows.length} dari {total} laporan
      </div>
      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--line)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--white)" }}>
          <thead>
            <tr>
              {[
                { label: "No",       cls: "" },
                { label: "Satker",   cls: "" },
                { label: "Unit Kerja", cls: "" },
                { label: "TW",       cls: "" },
                { label: "Pengisi",  cls: "" },
                { label: "IKU",      cls: "col-iku" },
                { label: "File",     cls: "col-file" },
                { label: "Pagu",     cls: "col-pagu" },
                { label: "Real.Keu", cls: "col-realkeu" },
                { label: "Serapan",  cls: "col-serapan" },
                { label: "Status",   cls: "" },
                { label: "Aksi",     cls: "" },
              ].map(({ label, cls }) => (
                <th key={label} className={cls} style={th}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} style={{ ...td, textAlign: "center", color: "var(--ink3)", padding: "32px" }}>
                  Belum ada data laporan
                </td>
              </tr>
            )}
            {rows.map((r, idx) => {
              const uc = UNIT_COLORS[r.unit_kerja_kode] ?? { color: "var(--ink3)", bg: "var(--line2)" }
              const isFinal = r.status === "FINAL"
              return (
                <tr key={r.id} style={{ transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--line2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td style={{ ...td, color: "var(--ink3)", fontFamily: "var(--mono)", fontSize: 11 }}>
                    {(page - 1) * 50 + idx + 1}
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{r.nama_satker}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink3)" }}>{r.kode_satker}</div>
                  </td>
                  <td style={td}>
                    <span style={{
                      background: uc.bg, color: uc.color,
                      borderRadius: 5, padding: "2px 7px",
                      fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                    }}>
                      {r.unit_kerja_kode}
                    </span>
                  </td>
                  <td style={{ ...td, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600 }}>
                    {r.triwulan}
                  </td>
                  <td style={td}>{r.pengisi}</td>
                  <td className="col-iku" style={{ ...td, textAlign: "center", fontFamily: "var(--mono)" }}>{r._count.iku}</td>
                  <td className="col-file" style={{ ...td, textAlign: "center", fontFamily: "var(--mono)" }}>{r._count.files}</td>
                  <td className="col-pagu" style={{ ...td, fontFamily: "var(--mono)", fontSize: 11 }}>{fmt(r.totalPagu)}</td>
                  <td className="col-realkeu" style={{ ...td, fontFamily: "var(--mono)", fontSize: 11 }}>{fmt(r.totalRealKeu)}</td>
                  <td className="col-serapan" style={{ ...td, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600 }}>{r.pctSerapan}</td>
                  <td style={td}>
                    <span style={{
                      background: isFinal ? "var(--green-bg)" : "var(--amber-bg)",
                      color: isFinal ? "var(--green)" : "var(--amber)",
                      borderRadius: 20, padding: "2px 9px",
                      fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`/laporan/${r.id}`}
                        style={{
                          background: "var(--navy-bg)", color: "var(--navy)",
                          border: "1px solid var(--navy)33", borderRadius: 6,
                          padding: "4px 8px", fontSize: 11, fontWeight: 600,
                          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                        <i className="fa-solid fa-eye" style={{ fontSize: 10 }}></i> Detail
                      </a>
                      <button onClick={() => handleDelete(r.id)}
                        style={{
                          background: "var(--red-bg)", color: "var(--red)",
                          border: "1px solid var(--red)33", borderRadius: 6,
                          padding: "4px 8px", fontSize: 11, fontWeight: 600,
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                        <i className="fa-solid fa-trash" style={{ fontSize: 10 }}></i> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button onClick={() => goPage(page - 1)} disabled={page <= 1}
            style={{
              background: "var(--white)", border: "1px solid var(--line)",
              borderRadius: 7, padding: "6px 14px", fontSize: 13, fontWeight: 600,
              color: "var(--ink2)", opacity: page <= 1 ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <i className="fa-solid fa-arrow-left" style={{ fontSize: 11 }}></i> Prev
          </button>
          <span style={{ fontSize: 13, color: "var(--ink3)" }}>
            Halaman {page} dari {totalPages}
          </span>
          <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
            style={{
              background: "var(--white)", border: "1px solid var(--line)",
              borderRadius: 7, padding: "6px 14px", fontSize: 13, fontWeight: 600,
              color: "var(--ink2)", opacity: page >= totalPages ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: 6,
            }}>
            Next <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i>
          </button>
        </div>
      )}
    </div>
  )
}
