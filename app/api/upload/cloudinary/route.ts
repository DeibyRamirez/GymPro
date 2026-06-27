import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-server"
import { getCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary/server"
import { MAX_IMAGES_PER_ITEM } from "@/lib/images/constants"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req)

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary no está configurado. Agrega CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env",
        },
        { status: 503 },
      )
    }

    const formData = await req.formData()
    const file = formData.get("file")
    const folder = String(formData.get("folder") || "gympro").trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG, WEBP o GIF." },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "La imagen no puede superar 5 MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const cloudinary = getCloudinary()

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error || new Error("No se pudo subir la imagen"))
              return
            }
            resolve({
              secure_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
            })
          },
        )
        .end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      maxImages: MAX_IMAGES_PER_ITEM,
    })
  } catch (error) {
    console.error("Error subiendo imagen a Cloudinary:", error)
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 })
  }
}
