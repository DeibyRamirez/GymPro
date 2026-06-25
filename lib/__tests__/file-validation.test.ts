/**
 * Tests de lib/file-validation.ts — validación de URLs e imágenes.
 */
import { validateAvatarUrl, validateImageUploadMetadata } from '@/lib/file-validation'

describe('lib/file-validation', () => {
  describe('validateAvatarUrl', () => {
    it('acepta rutas relativas', () => {
      expect(validateAvatarUrl('/avatars/user.jpg')).toBe(true)
    })

    it('acepta URLs https', () => {
      expect(validateAvatarUrl('https://cdn.example.com/a.png')).toBe(true)
    })

    it('rechaza javascript: y valores vacíos', () => {
      expect(validateAvatarUrl('javascript:alert(1)')).toBe(false)
      expect(validateAvatarUrl('')).toBe(false)
      expect(validateAvatarUrl(null)).toBe(false)
    })
  })

  describe('validateImageUploadMetadata', () => {
    it('acepta imagen jpeg válida', () => {
      const result = validateImageUploadMetadata({
        name: 'photo.jpg',
        size: 1024,
        type: 'image/jpeg',
      })
      expect(result.valid).toBe(true)
    })

    it('rechaza archivos demasiado grandes', () => {
      const result = validateImageUploadMetadata({
        name: 'big.png',
        size: 6 * 1024 * 1024,
        type: 'image/png',
      })
      expect(result.valid).toBe(false)
    })

    it('rechaza tipos MIME no permitidos', () => {
      const result = validateImageUploadMetadata({
        name: 'script.exe',
        size: 100,
        type: 'application/x-msdownload',
      })
      expect(result.valid).toBe(false)
    })
  })
})
