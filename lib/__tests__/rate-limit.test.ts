/**
 * Tests de lib/rate-limit.ts — protección contra fuerza bruta.
 */
import { checkRateLimit } from '@/lib/rate-limit'

describe('lib/rate-limit', () => {
  it('permite peticiones dentro del límite', () => {
    const key = `test-allow-${Date.now()}`
    expect(checkRateLimit(key, 3, 60_000).success).toBe(true)
    expect(checkRateLimit(key, 3, 60_000).success).toBe(true)
    expect(checkRateLimit(key, 3, 60_000).success).toBe(true)
  })

  it('bloquea cuando se supera el límite', () => {
    const key = `test-block-${Date.now()}`
    checkRateLimit(key, 2, 60_000)
    checkRateLimit(key, 2, 60_000)
    const blocked = checkRateLimit(key, 2, 60_000)
    expect(blocked.success).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('reinicia el contador tras expirar la ventana', () => {
    const key = `test-reset-${Date.now()}`
    jest.useFakeTimers()
    checkRateLimit(key, 1, 1000)
    expect(checkRateLimit(key, 1, 1000).success).toBe(false)
    jest.advanceTimersByTime(1001)
    expect(checkRateLimit(key, 1, 1000).success).toBe(true)
    jest.useRealTimers()
  })
})
