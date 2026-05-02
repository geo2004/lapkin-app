import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadFile(
  buffer: Buffer,
  fileId: string
): Promise<{ publicId: string; url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "lapklin-datadukung",
        public_id: fileId,
        resource_type: "raw",
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve({ publicId: result.public_id, url: result.secure_url })
      }
    )
    stream.end(buffer)
  })
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" })
}
