/**
 * Tests de lib/csrf.ts — protección cross-site request forgery.
 */
import { NextRequest } from 'next/server'
import { assertCsrf, verifyCsrf } from '@/lib/csrf'
import { AuthError } from '@/lib/auth-server'

function buildRequest(headers: Record<string, string>) {
  return new NextRequest('http://localhost:3000/api/sales', {
    method: 'POST',
    headers,
  })
}

describe('lib/csrf', () => {
  it('acepta Bearer token sin verificar Origin (clientes API)', () => {
    const req = buildRequest({ authorization: 'Bearer fake-token' })
    expect(verifyCsrf(req)).toBe(true)
  })

  it('acepta petición same-origin con header Origin válido', () => {
    const req = buildRequest({
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
    })
    expect(verifyCsrf(req)).toBe(true)
  })

  it('rechaza petición sin Origin ni Bearer', () => {
    const req = buildRequest({ host: 'localhost:3000' })
    expect(verifyCsrf(req)).toBe(false)
  })

  it('assertCsrf lanza AuthError 403 si falla', () => {
    const req = buildRequest({ host: 'evil.com' })
    expect(() => assertCsrf(req)).toThrow(AuthError)
    try {
      assertCsrf(req)
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError)
      expect((error as AuthError).status).toBe(403)
    }
  })
})
