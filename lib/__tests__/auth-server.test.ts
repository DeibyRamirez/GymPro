/**
 * Tests de lib/auth-server.ts — autenticación, RBAC y multi-tenant.
 *
 * Usamos mocks porque no queremos MongoDB real en tests unitarios.
 * Patrón: mock de dependencias externas, prueba solo la lógica del módulo.
 */
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import {
  assertSameGym,
  AuthError,
  ForbiddenError,
  handleAuthError,
  requireRoles,
  verifyAuth,
} from '@/lib/auth-server'
import type { IUser } from '@/lib/models/User'

jest.mock('../mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}))

jest.mock('../env', () => ({
  getJwtSecret: () => 'test-jwt-secret-for-unit-tests',
}))

import User from '../models/User'

const mockUser = {
  _id: { toString: () => 'user-1' },
  email: 'trainer@test.com',
  role: 'trainer',
  gymId: { toString: () => 'gym-a' },
  isActive: true,
} as unknown as IUser

function authRequest(token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  return new NextRequest('http://localhost:3000/api/users', { headers })
}

describe('lib/auth-server', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyAuth', () => {
    it('devuelve usuario cuando el token es válido', async () => {
      const token = jwt.sign({ userId: 'user-1' }, 'test-jwt-secret-for-unit-tests')
      ;(User.findById as jest.Mock).mockResolvedValue(mockUser)

      const user = await verifyAuth(authRequest(token))
      expect(user.email).toBe('trainer@test.com')
    })

    it('lanza AuthError si no hay token', async () => {
      await expect(verifyAuth(authRequest())).rejects.toThrow(AuthError)
    })

    it('lanza AuthError si el usuario está inactivo', async () => {
      const token = jwt.sign({ userId: 'user-1' }, 'test-jwt-secret-for-unit-tests')
      ;(User.findById as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false })

      await expect(verifyAuth(authRequest(token))).rejects.toThrow('Usuario no encontrado o inactivo')
    })
  })

  describe('requireRoles', () => {
    it('permite rol incluido en la lista', () => {
      expect(() => requireRoles(mockUser, ['trainer', 'admin'])).not.toThrow()
    })

    it('lanza ForbiddenError si el rol no está permitido', () => {
      expect(() => requireRoles(mockUser, ['admin'])).toThrow(ForbiddenError)
    })
  })

  describe('assertSameGym (multi-tenant)', () => {
    it('superadmin puede acceder a cualquier gym', () => {
      const superadmin = { ...mockUser, role: 'superadmin' } as IUser
      expect(() => assertSameGym(superadmin, 'gym-b')).not.toThrow()
    })

    it('trainer solo accede a su gymId', () => {
      expect(() => assertSameGym(mockUser, 'gym-a')).not.toThrow()
      expect(() => assertSameGym(mockUser, 'gym-b')).toThrow(ForbiddenError)
    })
  })

  describe('handleAuthError', () => {
    it('mapea AuthError al status correcto', () => {
      const result = handleAuthError(new AuthError('Token inválido', 401))
      expect(result).toEqual({ message: 'Token inválido', status: 401 })
    })

    it('devuelve 500 para errores desconocidos', () => {
      const result = handleAuthError(new Error('boom'))
      expect(result.status).toBe(500)
    })
  })
})
