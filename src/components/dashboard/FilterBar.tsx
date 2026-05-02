"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SATKER_LIST, UNIT_KERJA, TRIWULAN_LIST, STATUS_LIST } from "@/lib/constants"

export function FilterBar() {
  const router = useRouter()
  const sp = useSearchParams()

  function update(key: string, val: string) {
    const params = new URLSearchParams(sp.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete("page")
    router.push(`/dashboard?${params.toString()}`)
  }

  const sel: React.CSSProperties = {
    border: "1px solid var(--line)", borderRadius: 7,
    padding: "7px 10px", fontSize: 13, fontFamily: "var(--sans)",
    background: "var(--white)", color: "var(--ink)", outline: "none",
    minWidth: 160,
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
      <select style={sel} value={sp.get("satker") ?? ""} onChange={(e) => update("satker", e.target.value)}>
        <option value="">Semua Satker</option>
        {SATKER_LIST.map((s) => <option key={s.kode} value={s.kode}>{s.nama}</option>)}
      </select>

      <select style={sel} value={sp.get("unit") ?? ""} onChange={(e) => update("unit", e.target.value)}>
        <option value="">Semua Unit Kerja</option>
        {UNIT_KERJA.map((u) => <option key={u.kode} value={u.kode}>{u.nama}</option>)}
      </select>

      <select style={sel} value={sp.get("triwulan") ?? ""} onChange={(e) => update("triwulan", e.target.value)}>
        <option value="">Semua Triwulan</option>
        {TRIWULAN_LIST.map((tw) => <option key={tw} value={tw}>{tw}</option>)}
      </select>

      <select style={sel} value={sp.get("status") ?? ""} onChange={(e) => update("status", e.target.value)}>
        <option value="">Semua Status</option>
        {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
