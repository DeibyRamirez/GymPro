"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MAX_IMAGES_PER_ITEM } from "@/lib/images/constants"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useRef, useState } from "react"

interface CloudinaryImageUploadProps {
  label?: string
  value: string[]
  onChange: (images: string[]) => void
  folder?: string
  maxImages?: number
  disabled?: boolean
}

export function CloudinaryImageUpload({
  label = "Imágenes",
  value,
  onChange,
  folder = "gympro",
  maxImages = MAX_IMAGES_PER_ITEM,
  disabled = false,
}: CloudinaryImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const canAddMore = value.length < maxImages

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || disabled) return

    if (value.length >= maxImages) {
      setError(`Máximo ${maxImages} imágenes`)
      return
    }

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const response = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "No se pudo subir la imagen")
      }

      onChange([...value, data.url].slice(0, maxImages))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}

      <div className="flex flex-wrap gap-3">
        {value.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="relative h-20 w-20 overflow-hidden rounded-xl border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            {!disabled ? (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow-sm"
                aria-label="Quitar imagen"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ))}

        {canAddMore ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || uploading}
            />
            <Button
              type="button"
              variant="outline"
              className="h-20 w-20 flex-col gap-1 bg-transparent"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              <span className="text-[10px]">{value.length}/{maxImages}</span>
            </Button>
          </>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Sube hasta {maxImages} imágenes (JPG, PNG, WEBP o GIF · máx. 5 MB).
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
