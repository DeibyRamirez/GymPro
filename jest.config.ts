import type { Config } from 'jest'
import nextJest from 'next/jest.js'

/**
 * Configuración de Jest integrada con Next.js.
 *
 * - next/jest: transpila TS/JSX y resuelve el alias @/*
 * - testEnvironment 'node': tests de lib/ sin DOM (más rápido)
 * - collectCoverageFrom: mide cobertura en lib/ (excluye models Mongoose)
 * - coverageThreshold: el CI falla si bajamos del mínimo
 *
 * Comandos: pnpm test | pnpm test:watch | pnpm test:coverage
 */
const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/models/**',
  ],
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
}

export default createJestConfig(config)
