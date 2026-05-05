"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

// ── Types ─────────────────────────────────────────────────────────────────────

type IKUState = {
  id?: number
  urutan: number
  nama_iku: string
  satuan: string
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

type FileState = {
  id: string
  originalName: string
  sizeBytes: number
  cloudinaryUrl: string
}

type NewFile = {
  name: string
  sizeBytes: number
  fileId: string
  uploading: boolean
}

export type InitialData = {
  id: number
  kode_satker: string
  nama_satker: string
  wilayah: string
  triwulan: string
  tahun: number
  unit_kerja_kode: string
  unit_kerja_nama: string
  pengisi: string
  jabatan: string | null
  status: string
  link_datadukung: string | null
  createdAt: string
  iku: IKUState[]
  files: FileState[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const UNIT_COLORS: Record<string, { color: string; bg: string }> = {
  SETJEN: { color: "#0969da", bg: "#ddf4ff" },
  DJKP:  { color: "#1a7f37", bg: "#dcfce7" },
  DJPP:  { color: "#6639ba", bg: "#fbefff" },
  DJPK:  { color: "#1b7c83", bg: "#d8f3f6" },
  DJTK:  { color: "#9a6700", bg: "#fff8c5" },
}

function fmtSize(bytes: number) {
  return bytes < 1024 * 1024
    ? (bytes / 1024).toFixed(0) + " KB"
    : (bytes / 1024 / 1024).toFixed(1) + " MB"
}

function calcCapaian(iku: IKUState) {
  const tw  = iku.target_tw
  const rel = iku.realisasi_output
  if (tw > 0) return (rel / tw * 100).toFixed(1) + "%"
  return "—"
}

// ── Styles ────────────────────────────────────────────────────────────────────

const fi: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  border: "1px solid var(--line)", borderRadius: 7,
  fontFamily: "var(--sans)", background: "var(--white)",
  color: "var(--ink)", outline: "none",
}

const fta: React.CSSProperties = {
  ...fi, resize: "vertical", lineHeight: 1.6,
}

const fiMono: React.CSSProperties = {
  ...fi, fontFamily: "var(--mono)",
}

const fl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase" as const, letterSpacing: "0.06em",
  color: "var(--ink3)", marginBottom: 5,
}

const scard: React.CSSProperties = {
  background: "var(--white)", border: "1px solid var(--line)",
  borderRadius: 12, overflow: "hidden", marginBottom: 16,
}

const scardHead: React.CSSProperties = {
  padding: "12px 18px", borderBottom: "1px solid var(--line2)",
  display: "flex", alignItems: "center", justifyContent: "space-between",
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditForm({ initialData }: { initialData: InitialData }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Identitas (editable)
  const [pengisi, setPengisi]           = useState(initialData.pengisi)
  const [jabatan, setJabatan]           = useState(initialData.jabatan ?? "")
  const [status, setStatus]             = useState(initialData.status)
  const [linkDatadukung, setLinkDatadukung] = useState(initialData.link_datadukung ?? "")

  // IKU list
  const [ikuList, setIkuList] = useState<IKUState[]>(initialData.iku)

  // Files
  const [existingFiles, setExistingFiles] = useState<FileState[]>(initialData.files)
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<NewFile[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const uc = UNIT_COLORS[initialData.unit_kerja_kode] ?? { color: "var(--ink3)", bg: "var(--line2)" }

  // ── IKU helpers ──

  function updateIKU(idx: number, field: keyof IKUState, value: string | number) {
    setIkuList((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      // Auto-hitung % capaian
      if (field === "realisasi_output" || field === "target_tw") {
        next[idx].pct_capaian = calcCapaian(next[idx])
      }
      return next
    })
  }

  function deleteIKU(idx: number) {
    if (!confirm(`Hapus IKU "${ikuList[idx].nama_iku}"? Perubahan baru berlaku setelah disimpan.`)) return
    setIkuList((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      // Renumber urutan
      return next.map((item, i) => ({ ...item, urutan: i + 1 }))
    })
  }

  // ── File helpers ──

  function removeExistingFile(fileId: string) {
    if (!confirm("Hapus file ini dari laporan?")) return
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId))
    setDeletedFileIds((prev) => [...prev, fileId])
  }

  function removeNewFile(idx: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    e.target.value = ""

    for (const file of Array.from(files)) {
      if (file.size > 100 * 1024 * 1024) {
        setToast({ type: "err", text: `${file.name} melebihi 100MB` })
        continue
      }
      if (newFiles.length >= 10) {
        setToast({ type: "err", text: "Maksimal 10 file baru" })
        break
      }

      const placeholder: NewFile = { name: file.name, sizeBytes: file.size, fileId: "", uploading: true }
      setNewFiles((prev) => [...prev, placeholder])

      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/uploads", { method: "POST", body: fd })
        if (!res.ok) {
          const err = await res.json()
          setToast({ type: "err", text: `Gagal upload ${file.name}: ${err.error}` })
          setNewFiles((prev) => prev.filter((f) => f.name !== file.name))
        } else {
          const data = await res.json()
          setNewFiles((prev) => prev.map((f) =>
            f.name === file.name ? { ...f, fileId: data.fileId, uploading: false } : f
          ))
        }
      } catch {
        setToast({ type: "err", text: `Gagal upload ${file.name}` })
        setNewFiles((prev) => prev.filter((f) => f.name !== file.name))
      }
    }
  }

  // ── Save ──

  async function handleSave() {
    if (newFiles.some((f) => f.uploading)) {
      setToast({ type: "err", text: "Tunggu hingga semua file selesai diupload" })
      return
    }
    setSaving(true)
    setToast(null)
    try {
      const payload = {
        pengisi,
        jabatan,
        status,
        link_datadukung: linkDatadukung,
        iku: ikuList.map((item, i) => ({ ...item, urutan: i + 1 })),
        fileIds: newFiles.filter((f) => f.fileId).map((f) => f.fileId),
        deleteFileIds: deletedFileIds,
      }
      const res = await fetch(`/api/submissions/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      setToast({ type: "ok", text: "Berhasil disimpan!" })
      setTimeout(() => router.push(`/laporan/${initialData.id}`), 800)
    } catch {
      setToast({ type: "err", text: "Gagal menyimpan. Coba lagi." })
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* TOPBAR */}
      <div style={{
        background: "var(--pkp-teal)", color: "white", padding: "0 24px",
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 200, borderBottom: "3px solid var(--pkp-gold)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design/logo_pkp.png" alt="Logo PKP" style={{ height: 32, objectFit: "contain" }} />
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.25)" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Edit Laporan #{initialData.id}</div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>{initialData.nama_satker} · {initialData.triwulan} {initialData.tahun}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`/laporan/${initialData.id}`} style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 500,
            padding: "3px 10px", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)",
            textDecoration: "none",
          }}>
            ← Detail
          </a>
          <a href="/dashboard" style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 500,
            padding: "3px 10px", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.75)",
            textDecoration: "none",
          }}>
            Dashboard
          </a>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 100px" }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 68, right: 20, zIndex: 300,
            padding: "10px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: toast.type === "ok" ? "var(--green-bg)" : "var(--red-bg)",
            color: toast.type === "ok" ? "var(--green)" : "var(--red)",
            border: `1px solid ${toast.type === "ok" ? "rgba(26,127,55,0.2)" : "rgba(207,34,46,0.2)"}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            {toast.text}
          </div>
        )}

        {/* Header info */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{initialData.nama_satker}</h1>
            <span style={{
              background: uc.bg, color: uc.color, borderRadius: 5,
              padding: "2px 8px", fontSize: 11, fontWeight: 700,
            }}>
              {initialData.unit_kerja_kode}
            </span>
            <span style={{
              fontFamily: "var(--mono)", fontSize: 11,
              color: "var(--ink3)", marginLeft: 4,
            }}>
              {initialData.triwulan} {initialData.tahun}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 4 }}>
            <span style={{ fontFamily: "var(--mono)" }}>{initialData.kode_satker}</span>
            {" · "} Perubahan akan menggantikan data sebelumnya
          </div>
        </div>

        {/* ── STATUS CARD ── */}
        <div style={scard}>
          <div style={scardHead}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Status Laporan</div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            {/* Penjelasan DRAFT vs FINAL */}
            <div style={{
              background: "var(--navy-bg)", border: "1px solid var(--navy)22",
              borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12,
              color: "var(--ink2)", lineHeight: 1.7,
            }}>
              <strong>DRAFT</strong> — laporan masih dalam proses, dapat diubah kembali kapan saja.<br />
              <strong>FINAL</strong> — laporan dinyatakan selesai dan resmi. Tidak ada penguncian teknis; status ini hanya penanda administratif.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["DRAFT", "FINAL"].map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{
                    padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s",
                    background: status === s
                      ? (s === "FINAL" ? "var(--green)" : "var(--amber)")
                      : "var(--white)",
                    color: status === s
                      ? "white"
                      : (s === "FINAL" ? "var(--green)" : "var(--amber)"),
                    border: `2px solid ${s === "FINAL" ? "var(--green)" : "var(--amber)"}`,
                  }}>
                  {s === "DRAFT" ? "📝 DRAFT" : "✅ FINAL"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── IDENTITAS CARD ── */}
        <div style={scard}>
          <div style={scardHead}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Identitas</div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>
              Satker · Unit · Triwulan tidak dapat diubah
            </div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            {/* Read-only info */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
              background: "var(--line2)", borderRadius: 8, padding: "12px 14px", marginBottom: 14,
            }}>
              {[
                ["Satker", `${initialData.kode_satker} — ${initialData.nama_satker}`],
                ["Unit Kerja", `${initialData.unit_kerja_kode} — ${initialData.unit_kerja_nama}`],
                ["Triwulan", `${initialData.triwulan} · ${initialData.tahun}`],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink3)", marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Editable fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={fl}>Nama Pengisi</label>
                <input style={fi} value={pengisi} onChange={(e) => setPengisi(e.target.value)} placeholder="Nama lengkap" />
              </div>
              <div>
                <label style={fl}>Jabatan / NIP <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>opsional</span></label>
                <input style={fi} value={jabatan} onChange={(e) => setJabatan(e.target.value)} placeholder="Jabatan atau NIP" />
              </div>
            </div>
            <div>
              <label style={fl}>Link Data Dukung <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>opsional</span></label>
              <input style={fi} value={linkDatadukung} onChange={(e) => setLinkDatadukung(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* ── IKU CARD ── */}
        <div style={scard}>
          <div style={scardHead}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Capaian IKU</div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>{ikuList.length} indikator</div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            {ikuList.length === 0 && (
              <div style={{ color: "var(--ink3)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                Semua IKU telah dihapus. Simpan untuk menerapkan perubahan.
              </div>
            )}
            {ikuList.map((iku, idx) => (
              <div key={`${iku.id ?? "new"}-${idx}`} style={{
                border: "1px solid var(--line)", borderRadius: 10,
                overflow: "hidden", marginBottom: 14,
              }}>
                {/* IKU header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 14px", background: "var(--line2)",
                  borderBottom: "1px solid var(--line)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 22, height: 22, background: uc.color, color: "white",
                      borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                    }}>
                      {iku.urutan}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{iku.nama_iku}</span>
                  </div>
                  <button
                    onClick={() => deleteIKU(idx)}
                    title="Hapus IKU ini"
                    style={{
                      background: "var(--red-bg)", color: "var(--red)",
                      border: "1px solid var(--red)33", borderRadius: 6,
                      padding: "3px 10px", fontSize: 11, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    }}>
                    <i className="fa-solid fa-trash" style={{ fontSize: 9 }}></i> Hapus IKU
                  </button>
                </div>

                {/* IKU fields */}
                <div style={{ padding: "14px" }}>
                  {/* Satuan */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={fl}>Satuan Keluaran</label>
                    <input
                      style={fi}
                      value={iku.satuan}
                      onChange={(e) => updateIKU(idx, "satuan", e.target.value)}
                      placeholder="Dokumen, Paket, Unit, Laporan, Orang, ..."
                    />
                  </div>

                  {/* Row 1: Pagu, Target 2026, Target TW */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={fl}>Pagu <span style={{ fontWeight: 400, textTransform: "none" }}>(Rp)</span></label>
                      <input style={fiMono} type="number" min="0"
                        value={iku.pagu || ""}
                        onChange={(e) => updateIKU(idx, "pagu", parseFloat(e.target.value) || 0)}
                        placeholder="0" />
                    </div>
                    <div>
                      <label style={fl}>Target 2026</label>
                      <input style={fiMono} type="number" min="0"
                        value={iku.target_2026 || ""}
                        onChange={(e) => updateIKU(idx, "target_2026", parseFloat(e.target.value) || 0)}
                        placeholder="0" />
                    </div>
                    <div>
                      <label style={fl}>Target TW Ini</label>
                      <input style={fiMono} type="number" min="0"
                        value={iku.target_tw || ""}
                        onChange={(e) => updateIKU(idx, "target_tw", parseFloat(e.target.value) || 0)}
                        placeholder="0" />
                    </div>
                  </div>

                  {/* Row 2: Realisasi Output, Realisasi Keuangan, % Capaian */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={fl}>Realisasi Output</label>
                      <input style={fiMono} type="number" min="0"
                        value={iku.realisasi_output || ""}
                        onChange={(e) => updateIKU(idx, "realisasi_output", parseFloat(e.target.value) || 0)}
                        placeholder="0" />
                    </div>
                    <div>
                      <label style={fl}>Realisasi Keuangan <span style={{ fontWeight: 400, textTransform: "none" }}>(Rp)</span></label>
                      <input style={fiMono} type="number" min="0"
                        value={iku.realisasi_keuangan || ""}
                        onChange={(e) => updateIKU(idx, "realisasi_keuangan", parseFloat(e.target.value) || 0)}
                        placeholder="0" />
                    </div>
                    <div>
                      <label style={fl}>% Capaian Output</label>
                      <input style={{ ...fiMono, background: "var(--line2)", color: "var(--ink3)" }}
                        value={iku.pct_capaian} readOnly />
                    </div>
                  </div>

                  {/* Narasi */}
                  <div style={{ display: "grid", gap: 10 }}>
                    <div>
                      <label style={fl}>Keterangan Kegiatan</label>
                      <textarea style={{ ...fta, minHeight: 60 }}
                        value={iku.keterangan}
                        onChange={(e) => updateIKU(idx, "keterangan", e.target.value)}
                        placeholder="Uraikan kegiatan yang telah dilaksanakan..." />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={fl}>Permasalahan</label>
                        <textarea style={{ ...fta, minHeight: 56 }}
                          value={iku.permasalahan}
                          onChange={(e) => updateIKU(idx, "permasalahan", e.target.value)}
                          placeholder="Hambatan atau kendala..." />
                      </div>
                      <div>
                        <label style={fl}>Tindak Lanjut</label>
                        <textarea style={{ ...fta, minHeight: 56 }}
                          value={iku.tindak_lanjut}
                          onChange={(e) => updateIKU(idx, "tindak_lanjut", e.target.value)}
                          placeholder="Rencana tindak lanjut..." />
                      </div>
                    </div>
                    <div>
                      <label style={fl}>Faktor Keberhasilan</label>
                      <textarea style={{ ...fta, minHeight: 56 }}
                        value={iku.faktor_keberhasilan}
                        onChange={(e) => updateIKU(idx, "faktor_keberhasilan", e.target.value)}
                        placeholder="Faktor pendukung keberhasilan..." />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FILES CARD ── */}
        <div style={scard}>
          <div style={scardHead}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Data Dukung</div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>
              {existingFiles.length + newFiles.filter((f) => !f.uploading).length} file
            </div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            {/* Existing files */}
            {existingFiles.map((f) => {
              const ext = f.originalName.split(".").pop()?.toUpperCase() ?? "FILE"
              return (
                <div key={f.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--line2)", border: "1px solid var(--line)",
                  borderRadius: 7, padding: "7px 12px", marginBottom: 6, fontSize: 12,
                }}>
                  <span style={{
                    fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700,
                    background: "var(--amber-bg)", color: "var(--amber)",
                    padding: "2px 5px", borderRadius: 3,
                  }}>{ext}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{f.originalName}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink3)" }}>
                    {fmtSize(f.sizeBytes)}
                  </span>
                  <button onClick={() => removeExistingFile(f.id)} style={{
                    background: "var(--red-bg)", color: "var(--red)",
                    border: "1px solid var(--red)33", borderRadius: 5,
                    padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>
                    Hapus
                  </button>
                </div>
              )
            })}

            {/* New files (being uploaded / uploaded) */}
            {newFiles.map((f, idx) => (
              <div key={f.name + idx} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: f.uploading ? "var(--amber-bg)" : "var(--green-bg)",
                border: `1px solid ${f.uploading ? "var(--amber)33" : "var(--green)33"}`,
                borderRadius: 7, padding: "7px 12px", marginBottom: 6, fontSize: 12,
              }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink3)" }}>
                  {f.uploading ? "⏳" : "✅"}
                </span>
                <span style={{ flex: 1, fontWeight: 500 }}>{f.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink3)" }}>
                  {fmtSize(f.sizeBytes)}
                </span>
                {!f.uploading && (
                  <button onClick={() => removeNewFile(idx)} style={{
                    background: "var(--red-bg)", color: "var(--red)",
                    border: "1px solid var(--red)33", borderRadius: 5,
                    padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>
                    Batal
                  </button>
                )}
              </div>
            ))}

            {existingFiles.length === 0 && newFiles.length === 0 && (
              <div style={{ color: "var(--ink3)", fontSize: 13, marginBottom: 12 }}>Belum ada file terlampir.</div>
            )}

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: 8, padding: "8px 16px",
                background: "var(--navy-bg)", color: "var(--navy)",
                border: "1.5px dashed var(--navy)66", borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              <i className="fa-solid fa-plus" style={{ fontSize: 11 }}></i>
              Tambah File Baru
            </button>
            <input ref={fileInputRef} type="file" multiple hidden
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mp3"
              onChange={handleFileSelect} />
          </div>
        </div>

        {/* ── SAVE BAR ── */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "var(--white)", borderTop: "1px solid var(--line)",
          padding: "12px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 12, color: "var(--ink3)" }}>
            {ikuList.length} IKU · {existingFiles.length + newFiles.filter(f => !f.uploading).length} file
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href={`/laporan/${initialData.id}`} style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: "var(--white)", border: "1.5px solid var(--line)",
              color: "var(--ink2)", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              Batal
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: saving ? "var(--line)" : "var(--pkp-teal)",
                border: "none", color: "white", cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                opacity: saving ? 0.7 : 1,
              }}>
              <i className="fa-solid fa-floppy-disk" style={{ fontSize: 12 }}></i>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
