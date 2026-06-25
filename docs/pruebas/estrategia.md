# Estrategia de Pruebas

## Visión General

Aunque GymPro actualmente no tiene pruebas automatizadas implementadas, este documento define la estrategia de testing que se debe seguir para garantizar la calidad del software.

## Pirámide de Pruebas

```
           ┌─────────────┐
          /  E2E Tests   /  (10%)
         /  (Cypress)   /
        ┌──────────────┐
       /  Integration  /    (30%)
      /  Tests (Jest) /
     ┌───────────────┐
    /  Unit Tests    /      (60%)
   /  (Jest + RTL)  /
  └────────────────┘
```

## Tipos de Pruebas

### 1. Pruebas Unitarias (Unit Tests)

**Objetivo**: Probar funciones y componentes de forma aislada.

**Herramientas:**
- Jest (test runner)
- React Testing Library (componentes React)
- @testing-library/jest-dom (matchers para DOM)

**Alcance:**
- Funciones utilitarias (`lib/utils.ts`)
- Helpers de autenticación (`lib/auth.ts`)
- Validaciones de datos
- Transformaciones de modelos
- Componentes UI sin dependencias

**Ejemplo:**
```typescript
// lib/utils.test.ts
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge classes correctly', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });
  
  it('should handle conditional classes', () => {
    expect(cn('base-class', false && 'hidden', 'visible')).toBe('base-class visible');
  });
});

// components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with default variant', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should apply destructive variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-destructive');
  });
  
  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

**Cobertura Objetivo:** 80% de funciones y componentes base.

---

### 2. Pruebas de Integración (Integration Tests)

**Objetivo**: Probar la interacción entre componentes y API endpoints.

**Herramientas:**
- Jest
- Supertest (testing de APIs)
- MongoDB Memory Server (base de datos en memoria)

**Alcance:**
- Endpoints de API completos (request → response)
- Flujos de autenticación
- Creación y consulta de datos
- Relaciones entre modelos (populate)
- Middleware de autenticación

**Ejemplo:**
```typescript
// app/api/auth/login/route.test.ts
import { connectDB, disconnectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Gym from '@/lib/models/Gym';

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await connectDB();
  });
  
  afterAll(async () => {
    await disconnectDB();
  });
  
  beforeEach(async () => {
    await User.deleteMany({});
    await Gym.deleteMany({});
  });
  
  it('should login successfully with valid credentials', async () => {
    // Setup
    const gym = await Gym.create({ 
      name: 'Test Gym', 
      slug: 'test-gym' 
    });
    
    const user = await User.create({
      name: 'John Doe',
      email: 'john@test.com',
      password: '123456',
      role: 'client',
      gymId: gym._id
    });
    
    // Execute
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@test.com',
        password: '123456',
        gymSlug: 'test-gym'
      })
    });
    
    const data = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('john@test.com');
    expect(data.user.password).toBeUndefined(); // No debe exponer contraseña
  });
  
  it('should fail with invalid credentials', async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@test.com',
        password: 'wrongpass',
        gymSlug: 'test-gym'
      })
    });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});

// app/api/assignments/route.test.ts
describe('POST /api/assignments', () => {
  it('should clone routine when creating assignment', async () => {
    // Setup: Crear gym, trainer, client, routine original
    const gym = await Gym.create({ name: 'Test Gym', slug: 'test' });
    const trainer = await User.create({ 
      name: 'Trainer', 
      email: 'trainer@test.com', 
      role: 'trainer', 
      gymId: gym._id 
    });
    const client = await User.create({ 
      name: 'Client', 
      email: 'client@test.com', 
      role: 'client', 
      gymId: gym._id,
      trainerId: trainer._id
    });
    
    const originalRoutine = await Routine.create({
      name: 'Original Routine',
      gymId: gym._id,
      createdBy: trainer._id,
      exercises: [/* ... */]
    });
    
    // Execute: Crear asignación
    const response = await fetch('http://localhost:3000/api/assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trainerToken}`
      },
      body: JSON.stringify({
        clientId: client._id,
        routineId: originalRoutine._id,
        durationWeeks: 4
      })
    });
    
    const data = await response.json();
    
    // Assert: Verificar que se clonó la rutina
    expect(response.status).toBe(201);
    expect(data.assignment.routineId).not.toBe(originalRoutine._id.toString());
    
    const clonedRoutine = await Routine.findById(data.assignment.routineId);
    expect(clonedRoutine.sourceRoutineId.toString()).toBe(originalRoutine._id.toString());
    expect(clonedRoutine.isTemplate).toBe(false);
  });
});
```

**Cobertura Objetivo:** 70% de endpoints de API.

---

### 3. Pruebas End-to-End (E2E Tests)

**Objetivo**: Probar flujos completos de usuario en el navegador.

**Herramientas:**
- Cypress o Playwright
- cypress-mongodb (para seeding de datos)

**Alcance:**
- Flujos críticos de usuario
- Autenticación y autorización
- Creación de rutinas y asignaciones
- Calendario y seguimiento de progreso
- Punto de venta

**Ejemplo:**
```typescript
// cypress/e2e/trainer-creates-assignment.cy.ts
describe('Trainer creates assignment', () => {
  beforeEach(() => {
    // Seed database
    cy.task('seed:database');
    
    // Login as trainer
    cy.visit('http://test-gym.localhost:3000/login');
    cy.get('[data-testid="email-input"]').type('trainer@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.url().should('include', '/app/dashboard');
  });
  
  it('should create assignment with routine', () => {
    // Navigate to clients page
    cy.get('[data-testid="clients-nav"]').click();
    cy.url().should('include', '/app/clients');
    
    // Select client
    cy.get('[data-testid="client-card"]').first().click();
    
    // Click assign routine button
    cy.get('[data-testid="assign-routine-button"]').click();
    
    // Fill form
    cy.get('[data-testid="routine-select"]').click();
    cy.get('[data-testid="routine-option"]').first().click();
    
    cy.get('[data-testid="duration-weeks"]').type('4');
    
    // Select training days
    cy.get('[data-testid="day-checkbox-1"]').check(); // Lunes
    cy.get('[data-testid="day-checkbox-3"]').check(); // Miércoles
    cy.get('[data-testid="day-checkbox-5"]').check(); // Viernes
    
    // Submit
    cy.get('[data-testid="create-assignment-button"]').click();
    
    // Verify success
    cy.get('[data-testid="toast-success"]').should('be.visible');
    cy.get('[data-testid="assignment-card"]').should('exist');
    
    // Verify cloned routine
    cy.get('[data-testid="assignment-card"]')
      .find('[data-testid="routine-name"]')
      .should('not.be.empty');
  });
  
  it('should not allow assigning to client of another trainer', () => {
    cy.visit('http://test-gym.localhost:3000/app/clients/other-trainer-client-id');
    cy.get('[data-testid="assign-routine-button"]').should('not.exist');
  });
});

// cypress/e2e/client-views-progress.cy.ts
describe('Client views progress', () => {
  it('should display progress chart', () => {
    // Login as client
    cy.login('client@test.com', 'password123');
    
    // Navigate to progress page
    cy.get('[data-testid="progress-nav"]').click();
    
    // Verify chart is rendered
    cy.get('[data-testid="progress-chart"]').should('be.visible');
    
    // Add new measurement
    cy.get('[data-testid="add-measurement-button"]').click();
    cy.get('[data-testid="weight-input"]').type('75.5');
    cy.get('[data-testid="save-measurement-button"]').click();
    
    // Verify new data point in chart
    cy.get('[data-testid="progress-chart"]')
      .should('contain', '75.5');
  });
});
```

**Cobertura Objetivo:** 5-10 flujos críticos.

---

## Estrategia de Testing por Capa

### Frontend (Components)

**Qué probar:**
- Rendering condicional
- Manejo de eventos (onClick, onChange)
- Validación de formularios
- Estados de carga y error
- Accesibilidad (a11y)

**Qué NO probar:**
- Estilos (Tailwind es confiable)
- Implementación interna de bibliotecas (Radix UI)

### Backend (API Routes)

**Qué probar:**
- Validación de entrada
- Autenticación y autorización
- Lógica de negocio (clonación, cálculos)
- Manejo de errores
- Respuestas correctas (status, estructura)

**Qué NO probar:**
- Mongoose en sí (ya está probado)
- Next.js framework (ya está probado)

### Base de Datos (Models)

**Qué probar:**
- Validaciones de schema
- Hooks pre/post save
- Métodos custom del modelo
- Transformaciones toJSON

**Qué NO probar:**
- MongoDB en sí

---

## Configuración de Testing

### package.json (scripts)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open"
  }
}
```

### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### jest.setup.js
```javascript
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));
```

### cypress.config.ts
```typescript
import { defineConfig } from 'cypress';
import { MongoMemoryServer } from 'mongodb-memory-server';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      on('task', {
        async 'seed:database'() {
          const mongod = await MongoMemoryServer.create();
          const uri = mongod.getUri();
          // Seed database logic...
          return null;
        },
      });
    },
  },
});
```

---

## Casos de Prueba Críticos

### 1. Autenticación
- [ ] Login exitoso con credenciales válidas
- [ ] Login fallido con credenciales inválidas
- [ ] Registro de nuevo usuario
- [ ] Prevención de registro con email duplicado
- [ ] Token JWT válido y con expiración correcta
- [ ] Logout exitoso (elimina cookie)

### 2. Roles y Permisos
- [ ] Superadmin puede acceder a todos los gimnasios
- [ ] Admin solo puede acceder a su gimnasio
- [ ] Trainer solo puede ver/editar sus clientes
- [ ] Client solo puede ver sus propios datos
- [ ] Endpoints protegidos rechazan usuarios no autenticados

### 3. Sistema Multi-Tenant
- [ ] Subdominio correcto mapea a gimnasio correcto
- [ ] Usuarios de gym A no ven datos de gym B
- [ ] Rutinas de gym A no aparecen en gym B

### 4. Clonación de Rutinas
- [ ] Asignación clona rutina y ejercicios
- [ ] Modificar rutina clonada no afecta original
- [ ] sourceRoutineId mantiene trazabilidad
- [ ] isTemplate=false en copias

### 5. Calendario
- [ ] Assignment genera eventos correctamente
- [ ] Trainer puede crear clases grupales
- [ ] Client puede reservar clases (si hay cupos)
- [ ] Check-in con código válido marca asistencia
- [ ] Client solo ve sus eventos + clases públicas

### 6. Seguimiento de Progreso
- [ ] Registro de medición corporal se guarda
- [ ] Gráfico muestra datos correctos
- [ ] Progreso de rutina actualiza al completar ejercicio

### 7. Punto de Venta
- [ ] Venta reduce stock de productos
- [ ] Venta con stock insuficiente es rechazada
- [ ] Total de venta se calcula correctamente

---

## Implementación Prioritaria (Roadmap)

### Fase 1 (Actual): Sin Tests
- ⚠️ Testing manual
- ⚠️ Alta probabilidad de regresiones

### Fase 2 (Q3 2026): Tests Unitarios
- [ ] Configurar Jest + React Testing Library
- [ ] Tests de componentes UI (80% cobertura)
- [ ] Tests de funciones utilitarias (100% cobertura)

### Fase 3 (Q4 2026): Tests de Integración
- [ ] Configurar MongoDB Memory Server
- [ ] Tests de endpoints de API (70% cobertura)
- [ ] Tests de autenticación y autorización

### Fase 4 (Q1 2027): Tests E2E
- [ ] Configurar Cypress
- [ ] 5-10 flujos críticos
- [ ] Integración con CI/CD

---

## Buenas Prácticas de Testing

### 1. AAA Pattern (Arrange-Act-Assert)
```typescript
it('should do something', () => {
  // Arrange: Setup
  const user = { name: 'John', age: 30 };
  
  // Act: Execute
  const result = formatUser(user);
  
  // Assert: Verify
  expect(result).toBe('John (30)');
});
```

### 2. Test Isolation
- Cada test debe ser independiente
- Usar `beforeEach` para setup compartido
- Limpiar base de datos entre tests

### 3. Descriptive Test Names
```typescript
// ❌ Mal
it('works', () => { /* ... */ });

// ✅ Bien
it('should return 401 when token is invalid', () => { /* ... */ });
```

### 4. Don't Test Implementation Details
```typescript
// ❌ Mal (testing implementation)
expect(component.state.count).toBe(1);

// ✅ Bien (testing behavior)
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 5. Use Data-Testid Sparingly
```typescript
// ✅ Preferible (texto visible)
screen.getByText('Login');
screen.getByLabelText('Email');

// ⚠️ Solo si es necesario
screen.getByTestId('complex-component');
```

---

## Métricas de Calidad

### Cobertura de Código
- **Objetivo Global:** 70%
- **Unit Tests:** 80% (funciones + componentes)
- **Integration Tests:** 70% (API endpoints)
- **E2E Tests:** 100% de flujos críticos

### Tiempo de Ejecución
- Unit Tests: < 30 segundos
- Integration Tests: < 2 minutos
- E2E Tests: < 5 minutos

### Tasa de Falsos Positivos
- Objetivo: < 5% de tests flaky
- Re-ejecutar tests flaky antes de marcar como fallidos

---

## Herramientas Recomendadas

### Testing
- **Jest**: Test runner
- **React Testing Library**: Testing de componentes React
- **Cypress/Playwright**: E2E testing
- **Supertest**: Testing de APIs
- **MongoDB Memory Server**: Base de datos en memoria
- **MSW (Mock Service Worker)**: Mocking de APIs en frontend

### Cobertura y Reportes
- **Istanbul/NYC**: Cobertura de código
- **Codecov**: Reportes visuales de cobertura
- **Jest HTML Reporter**: Reportes HTML de tests

### CI/CD
- **GitHub Actions**: Pipeline de CI/CD
- **Vercel**: Deploy automático con preview
- **Husky + lint-staged**: Pre-commit hooks
