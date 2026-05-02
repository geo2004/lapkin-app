type Props = {
  total: number
  finalCount: number
  draftCount: number
  satkerAktif: number
}

export function StatCards({ total, finalCount, draftCount, satkerAktif }: Props) {
  const cards = [
    { label: "Total Laporan", value: total,      color: "var(--navy)",   bg: "var(--navy-bg)"  },
    { label: "Status FINAL",  value: finalCount, color: "var(--green)",  bg: "var(--green-bg)" },
    { label: "Status DRAFT",  value: draftCount, color: "var(--amber)",  bg: "var(--amber-bg)" },
    { label: "Satker Aktif",  value: satkerAktif,color: "var(--teal)",   bg: "var(--teal-bg)"  },
  ]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: c.bg, border: `1px solid ${c.color}33`,
          borderRadius: 10, padding: "14px 18px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  )
}
