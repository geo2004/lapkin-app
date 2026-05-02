import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Laporan Kinerja BP3KP Jawa III 2026",
  description: "Sistem pelaporan kinerja triwulanan BP3KP Jawa III",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
