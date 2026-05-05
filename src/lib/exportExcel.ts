import ExcelJS from "exceljs"
import { UNIT_KERJA, TRIWULAN_LIST } from "./constants"

const NAVY       = "FF0A3069"
const GREEN_DARK = "FF1A7F37"
const WHITE      = "FFFFFFFF"
const GREEN_LIGHT = "FFD8F3DC"
const AMBER_LIGHT = "FFFFF3CD"
const GRAY_LIGHT  = "FFF6F8FA"

type IKURow = {
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

export type SubmissionFull = {
  id: number
  createdAt: Date
  kode_satker: string
  nama_satker: string
  wilayah: string
  tahun: number
  triwulan: string
  unit_kerja_kode: string
  unit_kerja_nama: string
  pengisi: string
  jabatan: string | null
  status: string
  link_datadukung: string | null
  iku: IKURow[]
  files: { id: string; originalName: string; sizeBytes: number }[]
}

function rupiah(n: number) {
  return n.toLocaleString("id-ID")
}

function headerStyle(cell: ExcelJS.Cell, bg = NAVY) {
  cell.font = { bold: true, color: { argb: WHITE }, size: 10 }
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } }
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
  cell.border = {
    top: { style: "thin" }, left: { style: "thin" },
    bottom: { style: "thin" }, right: { style: "thin" },
  }
}

function dataCell(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin" }, left: { style: "thin" },
    bottom: { style: "thin" }, right: { style: "thin" },
  }
  cell.alignment = { vertical: "middle", wrapText: true }
}

export async function buildLapkinWorkbook(submissions: SubmissionFull[]): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = "BP3KP Jawa III"
  wb.created = new Date()

  // ── Sheet 1: Rekap Laporan ──────────────────────────────────────────────────
  const ws1 = wb.addWorksheet("Rekap Laporan")

  const s1Cols = [
    "No", "Tanggal", "Kode Satker", "Nama Satker", "Wilayah",
    "Triwulan", "Unit Kerja", "Pengisi", "Jabatan", "Status",
    "Jml IKU", "Total Pagu (Rp)", "Total Real. Keu (Rp)", "% Serapan",
    "Jml File", "Link Data Dukung",
  ]

  ws1.mergeCells(`A1:P1`)
  const t1 = ws1.getCell("A1")
  t1.value = "REKAP LAPORAN KINERJA TRIWULANAN — BP3KP JAWA III 2026"
  t1.font = { bold: true, size: 12, color: { argb: WHITE } }
  t1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } }
  t1.alignment = { horizontal: "center", vertical: "middle" }
  ws1.getRow(1).height = 30

  const hr1 = ws1.addRow(s1Cols)
  hr1.eachCell((c) => headerStyle(c, GREEN_DARK))
  ws1.getRow(2).height = 36

  submissions.forEach((s, idx) => {
    const totalPagu    = s.iku.reduce((a, i) => a + i.pagu, 0)
    const totalRealKeu = s.iku.reduce((a, i) => a + i.realisasi_keuangan, 0)
    const pct = totalPagu > 0 ? ((totalRealKeu / totalPagu) * 100).toFixed(1) + "%" : "—"

    const row = ws1.addRow([
      idx + 1,
      s.createdAt.toLocaleDateString("id-ID"),
      s.kode_satker, s.nama_satker, s.wilayah,
      s.triwulan, s.unit_kerja_nama, s.pengisi, s.jabatan ?? "",
      s.status,
      s.iku.length,
      rupiah(totalPagu),
      rupiah(totalRealKeu),
      pct,
      s.files.length,
      s.link_datadukung ?? "",
    ])

    row.eachCell((c) => dataCell(c))
    const fillArgb = s.status === "FINAL" ? GREEN_LIGHT : AMBER_LIGHT
    row.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } }
    })
    row.getCell(10).font = { bold: true, color: { argb: s.status === "FINAL" ? "FF1A7F37" : "FF9A6700" } }
  })

  const colWidths1 = [5, 12, 10, 28, 8, 8, 32, 22, 20, 8, 7, 18, 18, 10, 7, 40]
  colWidths1.forEach((w, i) => { ws1.getColumn(i + 1).width = w })
  ws1.autoFilter = { from: "A2", to: "P2" }
  ws1.views = [{ state: "frozen", ySplit: 2 }]

  // ── Sheet 2: Detail IKU ─────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet("Detail IKU")

  const s2Cols = [
    "No", "ID Sub", "Satker", "Triwulan", "Unit Kerja",
    "Urutan", "Nama IKU", "Satuan",
    "Pagu (Rp)", "Target 2026", "Target TW",
    "Real. Output", "Real. Keuangan (Rp)", "% Capaian",
    "Keterangan", "Permasalahan", "Tindak Lanjut", "Faktor Keberhasilan",
  ]

  ws2.mergeCells(`A1:R1`)
  const t2 = ws2.getCell("A1")
  t2.value = "DETAIL CAPAIAN IKU — LAPORAN KINERJA BP3KP JAWA III 2026"

  t2.font = { bold: true, size: 12, color: { argb: WHITE } }
  t2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } }
  t2.alignment = { horizontal: "center", vertical: "middle" }
  ws2.getRow(1).height = 30

  const hr2 = ws2.addRow(s2Cols)
  hr2.eachCell((c) => headerStyle(c, GREEN_DARK))
  ws2.getRow(2).height = 36

  let rowNo = 0
  submissions.forEach((s) => {
    s.iku.forEach((iku) => {
      rowNo++
      const row = ws2.addRow([
        rowNo, s.id, s.kode_satker, s.triwulan, s.unit_kerja_kode,
        iku.urutan, iku.nama_iku, iku.satuan,
        rupiah(iku.pagu), iku.target_2026, iku.target_tw,
        iku.realisasi_output, rupiah(iku.realisasi_keuangan), iku.pct_capaian,
        iku.keterangan, iku.permasalahan, iku.tindak_lanjut, iku.faktor_keberhasilan,
      ])
      row.eachCell((c) => dataCell(c))
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_LIGHT } }
    })
  })

  const colWidths2 = [5, 7, 10, 8, 10, 7, 50, 12, 18, 10, 10, 12, 18, 10, 35, 35, 35, 35]
  colWidths2.forEach((w, i) => { ws2.getColumn(i + 1).width = w })
  ws2.autoFilter = { from: "A2", to: "R2" }
  ws2.views = [{ state: "frozen", ySplit: 2 }]

  // ── Sheet 3: Ringkasan per Unit ─────────────────────────────────────────────
  const ws3 = wb.addWorksheet("Ringkasan per Unit")

  const twCols: string[] = []
  TRIWULAN_LIST.forEach((tw) => { twCols.push(`${tw} Masuk`, `${tw} Final`) })

  ws3.mergeCells(`A1:K1`)
  const t3 = ws3.getCell("A1")
  t3.value = "RINGKASAN PENGISIAN PER UNIT KERJA"
  t3.font = { bold: true, size: 12, color: { argb: WHITE } }
  t3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } }
  t3.alignment = { horizontal: "center", vertical: "middle" }
  ws3.getRow(1).height = 30

  const hr3 = ws3.addRow(["Unit Kerja", ...twCols, "Total"])
  hr3.eachCell((c) => headerStyle(c, GREEN_DARK))
  ws3.getRow(2).height = 36

  UNIT_KERJA.forEach((uk) => {
    const cells: (number | string)[] = [uk.nama]
    let total = 0
    TRIWULAN_LIST.forEach((tw) => {
      const forTw = submissions.filter((s) => s.unit_kerja_kode === uk.kode && s.triwulan === tw)
      const masuk = forTw.length
      const final = forTw.filter((s) => s.status === "FINAL").length
      cells.push(masuk, final)
      total += masuk
    })
    cells.push(total)
    const row = ws3.addRow(cells)
    row.eachCell((c) => dataCell(c))
  })

  // Totals row
  const totRow: (string | number)[] = ["TOTAL"]
  TRIWULAN_LIST.forEach((tw) => {
    const forTw = submissions.filter((s) => s.triwulan === tw)
    totRow.push(forTw.length, forTw.filter((s) => s.status === "FINAL").length)
  })
  totRow.push(submissions.length)
  const totalRowXl = ws3.addRow(totRow)
  totalRowXl.font = { bold: true }
  totalRowXl.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_LIGHT } }
    c.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
  })

  const colWidths3 = [38, ...Array(8).fill(10), 8]
  colWidths3.forEach((w, i) => { ws3.getColumn(i + 1).width = w })
  ws3.views = [{ state: "frozen", ySplit: 2 }]

  return await wb.xlsx.writeBuffer()
}
