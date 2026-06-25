# Skill: Seguridad

## Descripción

Guía completa de prácticas de seguridad para proteger la aplicación GymPro contra amenazas comunes y garantizar la integridad de los datos.

## Principios de Seguridad

### 1. Defensa en Profundidad (Defense in Depth)

**Múltiples capas de seguridad:**
```
┌─────────────────────────────────────┐
│  Frontend Validation (Cliente)     │  ← Primera línea
├─────────────────────────────────────┤
│  API Validation (Servidor)         │  ← Segunda línea
├─────────────────────────────────────┤
│  Database Validation (Mongoose)    │  ← Tercera línea
├─────────────────────────────────────┤
│  Encryption (bcrypt, JWT)          │  ← Capa adicional
└─────────────────────────────────────┘
```

### 2. Principio de Menor Privilegio (Least Privilege)

Cada usuario debe tener **solo los permisos necesarios** para su rol.

```typescript
// ❌ Mal: Todos pueden hacer todo
export async function DELETE(req: NextRequest) {
  await User.deleteMany({});
}

// ✅ Bien: Solo superadmin puede eliminar usuarios
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyAuth(req);
  
  if (user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  await User.findByIdAndUpdate(params.id, { isActive: false });
  return NextResponse.json({ message: 'User deactivated' });
}
```

### 3. Never Trust User Input

**SIEMPRE validar y sanitizar entrada del usuario.**

---

## Autenticación

### 1. Contraseñas Seguras

**Hashear con bcrypt (NUNCA almacenar en texto plano):**

```typescript
// lib/models/User.ts
import bcrypt from 'bcryptjs';

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Cost factor: 10 (recomendado por OWASP)
  // Mayor = más seguro pero más lento
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};
```

**Validación de contraseñas fuertes:**

```typescript
// lib/validators/password.ts
export function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
}

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una letra mayúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe incluir al menos un número');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Debe incluir al menos un símbolo (@$!%*?&)');
  }
  
  return errors;
}
```

### 2. JSON Web Tokens (JWT)

**Configuración segura:**

```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRATION = '7d';

// Validar que JWT_SECRET existe y es suficientemente largo
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 256 bits (32 caracteres)');
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'gympro',
    audience: 'gympro-users'
  });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'gympro',
      audience: 'gympro-users'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

**Cookies HTTP-only (protección contra XSS):**

```typescript
// app/api/auth/login/route.ts
const token = generateToken({ userId: user._id, email, role });

const response = NextResponse.json({ user, token });

response.cookies.set('auth-token', token, {
  httpOnly: true,       // No accesible desde JavaScript (XSS protection)
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
  sameSite: 'lax',      // Protección CSRF (evita envío cross-site)
  maxAge: 60 * 60 * 24 * 7, // 7 días
  path: '/'
});

return response;
```

### 3. Rate Limiting (Prevención de Fuerza Bruta)

**Limitar intentos de login:**

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number; // Ventana de tiempo (ms)
  uniqueTokenPerInterval: number; // Número de IPs distintas a trackear
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        
        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Uso en endpoint de login
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
  try {
    // Limitar a 5 intentos por minuto por IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await limiter.check(5, ip);
    
    // Lógica de login...
  } catch {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
}
```

**Alternativa con express-rate-limit (si usas Express):**

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## Autorización

### 1. Role-Based Access Control (RBAC)

**Middleware de verificación de roles:**

```typescript
// lib/auth/middleware.ts
type AllowedRole = 'superadmin' | 'admin' | 'trainer' | 'client';

export function requireRole(...allowedRoles: AllowedRole[]) {
  return async function(req: NextRequest) {
    const user = await verifyAuth(req);
    
    if (!allowedRoles.includes(user.role as AllowedRole)) {
      throw new Error('Insufficient permissions');
    }
    
    return user;
  };
}

// Uso
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('admin', 'superadmin')(req);
    // Solo admins y superadmins llegan aquí
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

### 2. Resource Ownership Validation

**Verificar que el usuario solo accede a SUS recursos:**

```typescript
// ❌ Mal: Cualquier usuario puede ver cualquier rutina
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const routine = await Routine.findById(params.id);
  return NextResponse.json(routine);
}

// ✅ Bien: Verificar pertenencia
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyAuth(req);
  
  const routine = await Routine.findById(params.id);
  
  if (!routine) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  // Verificar ownership
  const isOwner = routine.createdBy.toString() === user._id.toString();
  const isSameGym = routine.gymId.toString() === user.gymId.toString();
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  
  if (!isOwner && !isSameGym && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return NextResponse.json(routine);
}
```

---

## Validación de Entrada

### 1. Sanitización de Datos

**Evitar inyección de código:**

```typescript
// lib/validators/sanitize.ts
export function sanitizeString(input: string): string {
  // Eliminar caracteres peligrosos
  return input
    .trim()
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, ''); // Eliminar event handlers (onclick=, etc.)
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeNumber(value: any): number | null {
  const num = Number(value);
  return isNaN(num) ? null : num;
}
```

### 2. Validación con Zod

```typescript
// lib/validators/user.ts
import { z } from 'zod';

export const userCreateSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/\d/, 'Debe incluir al menos un número'),
  
  role: z.enum(['admin', 'trainer', 'client']),
  
  gymSlug: z.string()
    .min(2, 'Slug del gimnasio requerido'),
  
  age: z.number()
    .int()
    .min(13, 'Debes tener al menos 13 años')
    .max(120, 'Edad inválida')
    .optional(),
  
  weight: z.number()
    .positive()
    .max(500, 'Peso inválido')
    .optional(),
});

// Uso en endpoint
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Validar con Zod
  const validation = userCreateSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: validation.error.errors.map(e => e.message)
      },
      { status: 400 }
    );
  }
  
  const data = validation.data;
  // data está tipado y validado
}
```

### 3. Prevención de NoSQL Injection

```typescript
// ❌ Mal: Vulnerable a inyección
const user = await User.findOne({ email: req.body.email });

// Si el atacante envía: { email: { $ne: null } }
// Retornará el primer usuario de la DB

// ✅ Bien: Validar tipo de dato
export async function findUserByEmail(email: unknown) {
  // Asegurar que email es string
  if (typeof email !== 'string') {
    throw new Error('Invalid email format');
  }
  
  return User.findOne({ email: email.toLowerCase() });
}

// ✅ Mejor: Usar Mongoose sanitization
import mongoSanitize from 'express-mongo-sanitize';

// Sanitizar todo el body
const sanitizedBody = mongoSanitize.sanitize(req.body);
```

---

## Protección Contra Ataques Comunes

### 1. Cross-Site Scripting (XSS)

**Prevención:**

```typescript
// ❌ Mal: Renderizar HTML directamente
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Bien: React escapa automáticamente
<div>{userInput}</div>

// Si NECESITAS renderizar HTML (notas de entrenador, etc.):
import DOMPurify from 'isomorphic-dompurify';

function SafeHTML({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

**Content Security Policy (CSP):**

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.gympro.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 2. Cross-Site Request Forgery (CSRF)

**Protección con SameSite cookies:**

```typescript
// Ya implementado en cookies de autenticación
response.cookies.set('auth-token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax', // Evita envío de cookies en requests cross-site
});
```

**CSRF Token adicional para operaciones críticas:**

```typescript
// lib/csrf.ts
import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// Almacenar en sesión
response.cookies.set('csrf-token', generateCSRFToken(), {
  httpOnly: false, // Debe ser accesible desde JS
  secure: true,
  sameSite: 'strict'
});

// Validar en endpoints críticos (DELETE, modificaciones sensibles)
export async function DELETE(req: NextRequest) {
  const csrfToken = req.headers.get('x-csrf-token');
  const sessionToken = req.cookies.get('csrf-token')?.value;
  
  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  
  // Proceder con eliminación...
}
```

### 3. SQL/NoSQL Injection

**Ya cubierto en Validación de Entrada. Resumen:**
- ✅ Usar Mongoose (previene inyección por defecto)
- ✅ Validar tipos de datos
- ✅ Usar `mongoSanitize` para limpiar objetos complejos

### 4. Server-Side Request Forgery (SSRF)

**Prevención al hacer requests externos:**

```typescript
// ❌ Mal: Permitir cualquier URL
const url = req.query.url;
const response = await fetch(url);

// ✅ Bien: Whitelist de dominios permitidos
const ALLOWED_DOMAINS = [
  'api.stripe.com',
  'api.sendgrid.com',
  'storage.googleapis.com'
];

export async function fetchExternal(url: string) {
  const parsedUrl = new URL(url);
  
  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    throw new Error('Domain not allowed');
  }
  
  // Evitar IPs privadas
  if (parsedUrl.hostname.match(/^(10|127|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168)\./)) {
    throw new Error('Private IP not allowed');
  }
  
  return fetch(url);
}
```

---

## Manejo Seguro de Archivos

### 1. Validación de Uploads

```typescript
// lib/upload/validate.ts
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file: File): string[] {
  const errors: string[] = [];
  
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push('Tipo de archivo no permitido');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push('El archivo es demasiado grande (máx. 5MB)');
  }
  
  return errors;
}

// Validar extensión (no confiar solo en MIME type)
export function validateExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext || '');
}
```

### 2. Almacenamiento Seguro

```typescript
// ❌ Mal: Usar nombre original
const filePath = `/uploads/${file.name}`;

// ✅ Bien: Generar nombre único y seguro
import crypto from 'crypto';
import path from 'path';

export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
}

// Guardar fuera del webroot
const UPLOAD_DIR = path.join(process.cwd(), 'private', 'uploads');
```

---

## Logging y Auditoría

### 1. Logging de Eventos de Seguridad

```typescript
// lib/audit/logger.ts
export enum AuditEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  USER_CREATED = 'USER_CREATED',
  USER_DELETED = 'USER_DELETED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

export async function logAuditEvent(
  event: AuditEvent,
  userId: string | null,
  details: Record<string, any>
) {
  await AuditLog.create({
    event,
    userId,
    timestamp: new Date(),
    ip: details.ip,
    userAgent: details.userAgent,
    details
  });
  
  // Alertar en eventos críticos
  if (event === AuditEvent.SUSPICIOUS_ACTIVITY) {
    await sendSecurityAlert(details);
  }
}

// Uso
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for');
  const userAgent = req.headers.get('user-agent');
  
  try {
    // Login logic...
    await logAuditEvent(AuditEvent.LOGIN_SUCCESS, user._id, { ip, userAgent });
  } catch (error) {
    await logAuditEvent(AuditEvent.LOGIN_FAILURE, null, { 
      ip, 
      userAgent, 
      email: body.email,
      reason: error.message 
    });
  }
}
```

---

## Configuración de Producción

### 1. Variables de Entorno

```bash
# .env.production (NUNCA commitear)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/gympro?retryWrites=true&w=majority
JWT_SECRET=tu-secret-super-seguro-de-al-menos-256-bits-aleatorios
NODE_ENV=production
ALLOWED_ORIGINS=https://gympro.com,https://www.gympro.com
```

**Uso de secrets manager en producción:**

```typescript
// En Vercel, usar variables de entorno encriptadas
// En AWS, usar AWS Secrets Manager
// En Google Cloud, usar Secret Manager

// lib/config.ts
export const config = {
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV,
  
  // Validar en startup
  validate() {
    if (!this.mongodbUri) throw new Error('MONGODB_URI not defined');
    if (!this.jwtSecret || this.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
  }
};

config.validate();
```

### 2. Headers de Seguridad

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY'); // Prevenir clickjacking
  response.headers.set('X-Content-Type-Options', 'nosniff'); // Prevenir MIME sniffing
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HTTPS strict
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  return response;
}
```

---

## Checklist de Seguridad

### Autenticación
- [ ] Contraseñas hasheadas con bcrypt (cost ≥ 10)
- [ ] JWT con secret de ≥ 256 bits
- [ ] Cookies HTTP-only + SameSite
- [ ] Rate limiting en login (max 5/min)
- [ ] Expiración de sesiones (7 días)

### Autorización
- [ ] Verificación de rol en todos los endpoints protegidos
- [ ] Validación de ownership de recursos
- [ ] Principio de menor privilegio aplicado

### Validación
- [ ] Validación en frontend (react-hook-form + zod)
- [ ] Validación en backend (zod)
- [ ] Validación en DB (Mongoose schema)
- [ ] Sanitización de entrada (mongoSanitize, DOMPurify)

### Protección contra Ataques
- [ ] XSS: React escapa por defecto + DOMPurify si es necesario
- [ ] CSRF: SameSite cookies
- [ ] Injection: Validación de tipos + mongoSanitize
- [ ] SSRF: Whitelist de dominios externos

### Archivos
- [ ] Validación de tipo MIME y extensión
- [ ] Límite de tamaño (5MB recomendado)
- [ ] Nombres de archivo aleatorios
- [ ] Almacenamiento fuera del webroot

### Logging
- [ ] Eventos de seguridad registrados (login, cambios, errores)
- [ ] Alertas en actividad sospechosa
- [ ] Rotación de logs

### Producción
- [ ] Variables de entorno en secrets manager
- [ ] HTTPS obligatorio (HSTS)
- [ ] Security headers configurados
- [ ] Dependencias actualizadas (npm audit)

---

## Herramientas

### Análisis de Vulnerabilidades
```bash
# Escanear dependencias
npm audit

# Corregir vulnerabilidades automáticamente
npm audit fix

# Análisis estático de código
npm install -g eslint-plugin-security
```

### Monitoreo
- **Sentry**: Tracking de errores en producción
- **LogRocket**: Replay de sesiones con problemas
- **Datadog**: Monitoreo de infraestructura

---

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

## Aplicación en GymPro

Este skill es **CRÍTICO** y debe aplicarse en:
- ✅ TODOS los endpoints de API
- ✅ TODOS los formularios
- ✅ Manejo de archivos (avatares, imágenes)
- ✅ Configuración de producción
- ✅ Auditorías de seguridad periódicas
