import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "@libsql/client", "cloudinary"],
  // Ensure the static HTML form file is included in the Vercel serverless bundle.
  // Without this, readFileSync inside src/app/form/route.ts can't find the file
  // because Vercel's output file tracing doesn't detect dynamic runtime paths.
  outputFileTracingIncludes: {
    "/form": ["./src/form/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
}

export default nextConfig
