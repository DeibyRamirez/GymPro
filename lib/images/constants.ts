export const MAX_IMAGES_PER_ITEM = 4

export function normalizeImages(
  images?: string[] | null,
  fallbackImage?: string | null,
): string[] {
  const list = (images || []).map((item) => item.trim()).filter(Boolean).slice(0, MAX_IMAGES_PER_ITEM)
  if (list.length === 0 && fallbackImage?.trim()) {
    return [fallbackImage.trim()]
  }
  return list
}

export function primaryImage(
  images?: string[] | null,
  fallbackImage?: string | null,
  placeholder = "/placeholder.svg",
): string {
  return normalizeImages(images, fallbackImage)[0] || placeholder
}
