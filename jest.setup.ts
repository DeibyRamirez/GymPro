/**
 * Setup global de Jest — se ejecuta antes de cada archivo de test.
 * Extiende expect() con matchers de DOM (@testing-library/jest-dom).
 */
import '@testing-library/jest-dom'

// Variables de entorno mínimas para tests de lib/env y auth
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests'
process.env.ADMIN_SECRET_KEY = 'test-admin-secret'
