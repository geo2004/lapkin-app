import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Laporan Kinerja BP3KP Jawa III 2026",
  description: "Sistem pelaporan kinerja triwulanan BP3KP Jawa III",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
