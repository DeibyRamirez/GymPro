/**
 * VALIDACIÓN DE ARCHIVOS E IMÁGENES
 * ==================================
 *
 * Defensa en profundidad: aunque el frontend valide, el backend DEBE validar.
 * Un atacante puede llamar la API directamente con curl/Postman.
 *
 * Dos casos cubiertos:
 * 1. validateAvatarUrl → URLs guardadas en BD (campo avatar del usuario)
 * 2. validateImageUploadMetadata → metadatos cuando exista upload de archivos
 *
 * Previene: URLs javascript:, archivos gigantes, tipos MIME peligrosos.
 */

const MAX_AVATAR_URL_LENGTH = 2048
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

/**
 * Valida URL de avatar antes de guardar en User.avatar.
 * - Rutas relativas (/images/user.jpg) → OK (servidas desde tu dominio)
 * - URLs absolutas → solo http/https (bloquea javascript:, data:, etc.)
 */
export function validateAvatarUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false
  if (url.length > MAX_AVATAR_URL_LENGTH) return false

  if (url.startsWith('/')) return true

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Valida metadatos de un archivo de imagen (nombre, tamaño, MIME, extensión).
 * Usar cuando implementes upload con FormData/multipart.
 */
export function validateImageUploadMetadata(file: {
  name: string
  size: number
  type: string
}): { valid: boolean; error?: string } {
  if (!file.name?.trim()) {
    return { valid: false, error: 'Nombre de archivo inválido' }
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: 'El archivo excede el tamaño máximo permitido (5 MB)' }
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido' }
  }

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return { valid: false, error: 'Extensión de archivo no permitida' }
  }

  return { valid: true }
}
