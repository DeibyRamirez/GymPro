/**
 * Tests de lib/env.ts — validación de secrets.
 *
 * Aprende aquí: los tests de configuración aseguran que la app
 * no arranca en producción con valores inseguros por defecto.
 */
import { getAdminSecretKey, getJwtSecret, isSendGridConfigured, requireAdminSecretKey } from '@/lib/env'

describe('lib/env', () => {
  const originalJwt = process.env.JWT_SECRET
  const originalAdmin = process.env.ADMIN_SECRET_KEY
  const originalSendGridKey = process.env.SENDGRID_API_KEY
  const originalSendGridFrom = process.env.SENDGRID_FROM_EMAIL

  afterEach(() => {
    process.env.JWT_SECRET = originalJwt
    process.env.ADMIN_SECRET_KEY = originalAdmin
    process.env.SENDGRID_API_KEY = originalSendGridKey
    process.env.SENDGRID_FROM_EMAIL = originalSendGridFrom
  })

  it('getJwtSecret devuelve el secret configurado', () => {
    process.env.JWT_SECRET = 'mi-secret-seguro'
    expect(getJwtSecret()).toBe('mi-secret-seguro')
  })

  it('getJwtSecret lanza si falta JWT_SECRET', () => {
    delete process.env.JWT_SECRET
    expect(() => getJwtSecret()).toThrow('JWT_SECRET no está configurado')
  })

  it('getAdminSecretKey devuelve null si no está configurada', () => {
    delete process.env.ADMIN_SECRET_KEY
    expect(getAdminSecretKey()).toBeNull()
  })

  it('requireAdminSecretKey lanza si falta la clave', () => {
    delete process.env.ADMIN_SECRET_KEY
    expect(() => requireAdminSecretKey()).toThrow('ADMIN_SECRET_KEY no está configurado')
  })

  it('isSendGridConfigured es false sin variables', () => {
    delete process.env.SENDGRID_API_KEY
    delete process.env.SENDGRID_FROM_EMAIL
    expect(isSendGridConfigured()).toBe(false)
  })

  it('isSendGridConfigured es true con API key y from email', () => {
    process.env.SENDGRID_API_KEY = 'SG.test'
    process.env.SENDGRID_FROM_EMAIL = 'noreply@gympro.com'
    expect(isSendGridConfigured()).toBe(true)
  })
})
