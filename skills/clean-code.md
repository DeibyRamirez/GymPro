# Skill: Código Limpio (Clean Code)

## Descripción

Este skill proporciona directrices y mejores prácticas para escribir código limpio, mantenible y profesional en el proyecto GymPro.

## Principios Fundamentales

### 1. Nombres Significativos

**Variables y Funciones:**
```typescript
// ❌ Mal
const d = new Date();
const x = user.name;
function calc(a, b) { return a + b; }

// ✅ Bien
const currentDate = new Date();
const userName = user.name;
function calculateTotal(price, quantity) { 
  return price * quantity; 
}
```

**Clases y Componentes:**
```typescript
// ❌ Mal
class Data { }
function comp() { }

// ✅ Bien
class UserRepository { }
function UserProfileCard() { }
```

**Constantes:**
```typescript
// ❌ Mal
const MAX = 100;
const msg = 'Error';

// ✅ Bien
const MAX_USERS_PER_GYM = 100;
const ERROR_MESSAGE_UNAUTHORIZED = 'Usuario no autorizado';
```

---

### 2. Funciones Pequeñas y Enfocadas

**Una función debe hacer una sola cosa y hacerla bien.**

```typescript
// ❌ Mal (hace múltiples cosas)
async function processUser(userId: string) {
  const user = await User.findById(userId);
  user.lastLogin = new Date();
  await user.save();
  
  const gym = await Gym.findById(user.gymId);
  const assignment = await Assignment.findOne({ clientId: userId });
  
  sendEmail(user.email, 'Welcome');
  logActivity('user_login', userId);
  
  return { user, gym, assignment };
}

// ✅ Bien (separado en funciones específicas)
async function updateUserLastLogin(userId: string) {
  const user = await User.findById(userId);
  user.lastLogin = new Date();
  await user.save();
  return user;
}

async function getUserDashboardData(userId: string) {
  const user = await User.findById(userId);
  const gym = await Gym.findById(user.gymId);
  const assignment = await Assignment.findOne({ clientId: userId });
  
  return { user, gym, assignment };
}

async function notifyUserLogin(email: string) {
  await sendEmail(email, 'Welcome');
  await logActivity('user_login', email);
}
```

**Límite recomendado:** 20-30 líneas por función.

---

### 3. Evitar Comentarios Innecesarios

**El código debe ser autoexplicativo. Los comentarios deben explicar el "por qué", no el "qué".**

```typescript
// ❌ Mal (comentario innecesario)
// Incrementar el contador
counter++;

// ❌ Mal (comentario que repite el código)
// Buscar usuario por ID
const user = await User.findById(userId);

// ✅ Bien (sin comentario, código claro)
const hasPermission = user.role === 'admin' || user.role === 'superadmin';

// ✅ Bien (comentario que explica decisión de diseño)
// Usamos bcrypt con cost factor 10 (recomendado por OWASP)
// para balance entre seguridad y performance
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ Bien (documenta complejidad de negocio)
// Los clientes pueden tener el mismo email en diferentes gimnasios,
// pero debe ser único dentro del mismo gimnasio
UserSchema.index({ email: 1, gymId: 1 }, { unique: true });
```

---

### 4. DRY (Don't Repeat Yourself)

**Evitar duplicación de código.**

```typescript
// ❌ Mal (código duplicado)
const trainer = await User.findById(trainerId);
if (!trainer || trainer.role !== 'trainer') {
  return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
}

const client = await User.findById(clientId);
if (!client || client.role !== 'client') {
  return NextResponse.json({ error: 'Client not found' }, { status: 404 });
}

// ✅ Bien (función reutilizable)
async function findUserByRole(userId: string, role: string) {
  const user = await User.findById(userId);
  
  if (!user || user.role !== role) {
    throw new Error(`${role} not found`);
  }
  
  return user;
}

// Uso
const trainer = await findUserByRole(trainerId, 'trainer');
const client = await findUserByRole(clientId, 'client');
```

---

### 5. Manejo de Errores Consistente

```typescript
// ❌ Mal (manejo inconsistente)
try {
  const user = await User.findById(userId);
  return user;
} catch (err) {
  console.log(err);
  return null;
}

// ✅ Bien (manejo consistente)
try {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
} catch (error: unknown) {
  console.error('Error fetching user:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to fetch user: ${message}`);
}
```

---

### 6. Evitar "Magic Numbers" y "Magic Strings"

```typescript
// ❌ Mal
if (user.age > 18) { /* ... */ }
if (status === 'active') { /* ... */ }

// ✅ Bien
const MINIMUM_AGE = 18;
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const;

if (user.age > MINIMUM_AGE) { /* ... */ }
if (status === USER_STATUS.ACTIVE) { /* ... */ }
```

---

### 7. Validación Temprana (Early Return)

```typescript
// ❌ Mal (anidamiento profundo)
function processPayment(amount, user) {
  if (amount > 0) {
    if (user) {
      if (user.balance >= amount) {
        // Proceso de pago
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// ✅ Bien (early return)
function processPayment(amount: number, user: User): boolean {
  if (amount <= 0) return false;
  if (!user) return false;
  if (user.balance < amount) return false;
  
  // Proceso de pago
  return true;
}
```

---

### 8. Inmutabilidad

```typescript
// ❌ Mal (mutación directa)
function addExercise(routine, exercise) {
  routine.exercises.push(exercise);
  return routine;
}

// ✅ Bien (inmutable)
function addExercise(routine: Routine, exercise: Exercise): Routine {
  return {
    ...routine,
    exercises: [...routine.exercises, exercise]
  };
}
```

---

## Patrones de Código Limpio en GymPro

### Componentes React

```typescript
// ✅ Estructura recomendada
"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserCardProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserCard({ userId, onUpdate }: UserCardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUser();
  }, [userId]);
  
  async function fetchUser() {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Usuario no encontrado</div>;
  
  return (
    <Card>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <Button onClick={() => onUpdate?.(user)}>Actualizar</Button>
    </Card>
  );
}
```

### API Routes

```typescript
// ✅ Estructura recomendada
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import User from '@/lib/models/User';

const ALLOWED_ROLES = ['admin', 'superadmin'] as const;

export async function GET(req: NextRequest) {
  try {
    // 1. Autenticación
    const currentUser = await verifyAuth(req);
    
    // 2. Autorización
    if (!ALLOWED_ROLES.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }
    
    // 3. Validación de entrada
    const searchParams = req.nextUrl.searchParams;
    const gymId = searchParams.get('gymId');
    
    if (!gymId) {
      return NextResponse.json(
        { error: 'gymId is required' }, 
        { status: 400 }
      );
    }
    
    // 4. Lógica de negocio
    const users = await findUsersByGym(gymId);
    
    // 5. Respuesta
    return NextResponse.json({ users }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function findUsersByGym(gymId: string) {
  return User.find({ gymId })
    .select('name email role avatar')
    .sort({ createdAt: -1 })
    .lean();
}
```

---

## Checklist de Código Limpio

Antes de hacer commit, verifica:

- [ ] **Nombres descriptivos**: Variables, funciones y clases tienen nombres claros
- [ ] **Funciones pequeñas**: Cada función hace una sola cosa (< 30 líneas)
- [ ] **Sin código comentado**: Eliminar código obsoleto
- [ ] **Sin console.log**: Usar logger apropiado (o eliminar)
- [ ] **Manejo de errores**: Try-catch con mensajes claros
- [ ] **Validación de entrada**: Todos los parámetros validados
- [ ] **TypeScript estricto**: Sin `any`, usar tipos específicos
- [ ] **Sin duplicación**: Código reutilizable extraído a funciones
- [ ] **Formato consistente**: Prettier aplicado
- [ ] **Imports organizados**: Agrupados y ordenados

---

## Herramientas

### ESLint (Configuración recomendada)

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }],
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  }
}
```

### Prettier (Configuración recomendada)

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

---

## Recursos

- **Clean Code** by Robert C. Martin
- **Refactoring** by Martin Fowler
- **Effective TypeScript** by Dan Vanderkam
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

## Aplicación en GymPro

Este skill debe aplicarse en:
- ✅ Nuevos componentes React
- ✅ Nuevos API endpoints
- ✅ Refactoring de código existente
- ✅ Code reviews
- ✅ Corrección de bugs

**Objetivo:** Mantener una base de código profesional, mantenible y escalable.
