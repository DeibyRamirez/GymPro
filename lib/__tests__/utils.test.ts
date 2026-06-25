/**
 * Tests de lib/utils.ts — utilidad cn() para clases Tailwind.
 */
import { cn } from '@/lib/utils'

describe('lib/utils cn()', () => {
  it('combina clases simples', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
  })

  it('resuelve conflictos de Tailwind (twMerge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ignora valores falsy en condicionales', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })
})
