// One-time script to push the Prisma schema to Turso.
// Run with: node scripts/push-schema-to-turso.mjs
import { createClient } from "@libsql/client"
import { config } from "dotenv"

config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const statements = [
  `CREATE TABLE IF NOT EXISTS "Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kode_satker" TEXT NOT NULL,
    "nama_satker" TEXT NOT NULL,
    "wilayah" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL DEFAULT 2026,
    "triwulan" TEXT NOT NULL,
    "unit_kerja_kode" TEXT NOT NULL,
    "unit_kerja_nama" TEXT NOT NULL,
    "pengisi" TEXT NOT NULL,
    "jabatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "link_datadukung" TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS "IKU" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submissionId" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,
    "nama_iku" TEXT NOT NULL,
    "pagu" REAL NOT NULL DEFAULT 0,
    "target_2026" REAL NOT NULL DEFAULT 0,
    "target_tw" REAL NOT NULL DEFAULT 0,
    "realisasi_output" REAL NOT NULL DEFAULT 0,
    "realisasi_keuangan" REAL NOT NULL DEFAULT 0,
    "pct_capaian" TEXT NOT NULL DEFAULT '—',
    "keterangan" TEXT NOT NULL DEFAULT '',
    "permasalahan" TEXT NOT NULL DEFAULT '',
    "tindak_lanjut" TEXT NOT NULL DEFAULT '',
    "faktor_keberhasilan" TEXT NOT NULL DEFAULT '',
    FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "UploadedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" INTEGER,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Submission_kode_satker_unit_kerja_kode_triwulan_tahun_idx" ON "Submission"("kode_satker", "unit_kerja_kode", "triwulan", "tahun")`,
  `CREATE INDEX IF NOT EXISTS "Submission_status_idx" ON "Submission"("status")`,
  `CREATE INDEX IF NOT EXISTS "Submission_triwulan_idx" ON "Submission"("triwulan")`,
  `CREATE INDEX IF NOT EXISTS "Submission_unit_kerja_kode_idx" ON "Submission"("unit_kerja_kode")`,
  `CREATE INDEX IF NOT EXISTS "IKU_submissionId_idx" ON "IKU"("submissionId")`,
  `CREATE INDEX IF NOT EXISTS "UploadedFile_submissionId_idx" ON "UploadedFile"("submissionId")`,
]

for (const sql of statements) {
  await client.execute(sql)
  console.log("✓", sql.trim().split("\n")[0].slice(0, 60))
}

console.log("\nSchema pushed to Turso successfully.")
