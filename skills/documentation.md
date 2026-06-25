# Skill: Documentación de Código

## Descripción

Directrices para documentar código de forma efectiva, facilitando la comprensión, mantenimiento y colaboración en el proyecto GymPro.

## Principios de Documentación

### 1. El Código Debe Ser Autoexplicativo

**La documentación NO debe compensar código mal escrito.**

```typescript
// ❌ Mal (código confuso que necesita comentarios)
// Obtener el ID del usuario desde el token JWT
const uid = jwt.verify(t, s).id;

// ✅ Bien (código claro sin necesidad de comentarios)
const decodedToken = jwt.verify(token, JWT_SECRET);
const userId = decodedToken.userId;
```

### 2. Documentar el "Por Qué", No el "Qué"

```typescript
// ❌ Mal (documenta lo obvio)
// Crear un nuevo usuario
const user = new User(userData);

// ✅ Bien (explica decisión de diseño)
// Usamos índice compuesto email+gymId porque el mismo email
// puede existir en diferentes gimnasios (multi-tenant)
UserSchema.index({ email: 1, gymId: 1 }, { unique: true });
```

---

## Tipos de Documentación

### 1. Comentarios en Línea

**Usar solo cuando sea necesario aclarar lógica compleja.**

```typescript
// ✅ Ejemplo: Explicar algoritmo complejo
function getNextTrainingDate(assignment: Assignment, currentDate: Date): Date {
  // Buscamos el siguiente día de entrenamiento basado en weeklySchedule
  // Consideramos solo días activos (isRestDay === false)
  const trainingDays = assignment.weeklySchedule
    .filter(day => !day.isRestDay)
    .map(day => day.dayOfWeek)
    .sort((a, b) => a - b);
  
  const currentDayOfWeek = currentDate.getDay();
  
  // Si hoy es día de entrenamiento, retornar hoy
  if (trainingDays.includes(currentDayOfWeek)) {
    return currentDate;
  }
  
  // Buscar el próximo día de entrenamiento en la semana actual
  const nextDay = trainingDays.find(day => day > currentDayOfWeek);
  if (nextDay) {
    const daysToAdd = nextDay - currentDayOfWeek;
    return addDays(currentDate, daysToAdd);
  }
  
  // Si no hay más días esta semana, ir al primer día de la siguiente
  const daysUntilNextWeek = 7 - currentDayOfWeek + trainingDays[0];
  return addDays(currentDate, daysUntilNextWeek);
}
```

### 2. JSDoc para Funciones Públicas

**Documentar interfaz pública de módulos, funciones y clases.**

```typescript
/**
 * Verifica la autenticación del usuario desde el token JWT.
 * 
 * Busca el token en cookies (preferido) o en el header Authorization.
 * Valida que el usuario existe y está activo en la base de datos.
 * 
 * @param req - Request de Next.js con cookies y headers
 * @returns Usuario autenticado con información completa
 * @throws {Error} Si el token es inválido o el usuario no está activo
 * 
 * @example
 * ```typescript
 * const user = await verifyAuth(req);
 * console.log(user.role); // 'admin'
 * ```
 */
export async function verifyAuth(req: NextRequest): Promise<User> {
  // Implementación...
}

/**
 * Clona una rutina y sus ejercicios para personalización del cliente.
 * 
 * Crea copias profundas (deep copy) de la rutina y todos sus ejercicios,
 * manteniendo trazabilidad con sourceRoutineId y sourceExerciseId.
 * 
 * @param routineId - ID de la rutina original (plantilla)
 * @param userId - ID del trainer que crea la copia
 * @param gymId - ID del gimnasio para aislamiento multi-tenant
 * @returns ID de la rutina clonada
 * 
 * @remarks
 * Las copias tienen isTemplate=false para distinguirlas de las plantillas.
 * Los ejercicios clonados mantienen configuración (sets, reps, rest).
 * 
 * @see {@link Assignment} Para uso en asignaciones
 */
async function cloneRoutine(
  routineId: string, 
  userId: string, 
  gymId: string
): Promise<string> {
  // Implementación...
}
```

**Etiquetas JSDoc útiles:**
- `@param` - Parámetros de entrada
- `@returns` - Valor de retorno
- `@throws` - Errores que puede lanzar
- `@example` - Ejemplo de uso
- `@remarks` - Información adicional
- `@see` - Referencias relacionadas
- `@deprecated` - Marcar como obsoleto

### 3. Comentarios de Sección

**Organizar código largo en secciones lógicas.**

```typescript
export async function POST(req: NextRequest) {
  try {
    // ===================================
    // 1. AUTENTICACIÓN Y AUTORIZACIÓN
    // ===================================
    const user = await verifyAuth(req);
    if (user.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // ===================================
    // 2. VALIDACIÓN DE ENTRADA
    // ===================================
    const body = await req.json();
    const { clientId, routineId, durationWeeks } = body;
    
    if (!clientId || !routineId || !durationWeeks) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // ===================================
    // 3. CLONACIÓN DE RUTINA
    // ===================================
    const clonedRoutineId = await cloneRoutine(routineId, user._id, user.gymId);
    
    // ===================================
    // 4. CREACIÓN DE ASIGNACIÓN
    // ===================================
    const assignment = new Assignment({
      clientId,
      trainerId: user._id,
      routineId: clonedRoutineId,
      durationWeeks,
      gymId: user.gymId
    });
    
    await assignment.save();
    
    // ===================================
    // 5. RESPUESTA
    // ===================================
    return NextResponse.json({ assignment }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### 4. README de Módulos

**Para carpetas con múltiples archivos relacionados, crear `README.md`.**

```markdown
# Módulo: Autenticación

## Descripción

Sistema de autenticación basado en JWT con soporte para cookies HTTP-only y header Authorization.

## Archivos

- `auth.ts` - Funciones de verificación y generación de tokens
- `middleware.ts` - Middleware de protección de rutas
- `login/route.ts` - Endpoint de login
- `register/route.ts` - Endpoint de registro
- `logout/route.ts` - Endpoint de logout

## Flujo de Autenticación

1. Usuario envía credenciales a `/api/auth/login`
2. Se valida email + password + gymSlug
3. Se genera JWT con `{ userId, email, role }`
4. Se retorna token en response + cookie HTTP-only
5. Cliente almacena token (opcional, cookie ya persiste)
6. Requests posteriores incluyen cookie automáticamente
7. Middleware `verifyAuth` valida token en cada request

## Uso

```typescript
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  // user contiene: _id, name, email, role, gymId, etc.
}
```

## Seguridad

- Contraseñas hasheadas con bcrypt (cost factor 10)
- JWT firmado con secret de 256 bits
- Cookie HTTP-only (no accesible desde JavaScript)
- Cookie SameSite: lax (protección CSRF)
- Cookie Secure en producción (HTTPS only)
- Expiración de token: 7 días

## Testing

```bash
npm test auth
```
```

---

## Documentación de Componentes React

### Props con TypeScript

```typescript
/**
 * Card de información del entrenador asignado a un cliente.
 * 
 * Muestra avatar, nombre, email y botón para enviar mensaje directo.
 * 
 * @component
 * @example
 * ```tsx
 * <TrainerInfoCard 
 *   trainer={{ name: "John Doe", email: "john@gym.com" }}
 *   onMessage={() => console.log('Mensaje enviado')}
 * />
 * ```
 */
interface TrainerInfoCardProps {
  /** Información del entrenador (populate desde User) */
  trainer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  /** Callback al hacer click en "Enviar mensaje" */
  onMessage?: () => void;
  /** Clase CSS adicional (opcional) */
  className?: string;
}

export function TrainerInfoCard({ 
  trainer, 
  onMessage, 
  className 
}: TrainerInfoCardProps) {
  // Implementación...
}
```

### Hooks Personalizados

```typescript
/**
 * Hook para manejar autenticación del usuario actual.
 * 
 * Obtiene información del usuario desde el endpoint /api/auth/me.
 * Cachea el resultado y provee estado de carga y error.
 * 
 * @returns {Object} Estado de autenticación
 * @returns {User | null} user - Usuario autenticado o null
 * @returns {boolean} loading - Indica si está cargando
 * @returns {string | null} error - Mensaje de error si falla
 * @returns {Function} refetch - Función para recargar datos
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { user, loading, error } = useAuth();
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *   if (!user) return <Login />;
 *   
 *   return <div>Bienvenido {user.name}</div>;
 * }
 * ```
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Implementación...
  
  return { user, loading, error, refetch };
}
```

---

## Documentación de API (Swagger/OpenAPI)

**Usar anotaciones para generar documentación automática.**

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene lista de usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gymId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del gimnasio
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, trainer, client]
 *         description: Filtrar por rol
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 */
export async function GET(req: NextRequest) {
  // Implementación...
}
```

---

## Documentación de Modelos (Mongoose)

```typescript
/**
 * Modelo de Usuario del sistema.
 * 
 * Soporta 4 roles: superadmin, admin, trainer, client.
 * Multi-tenant por gymId.
 * Contraseñas hasheadas automáticamente con bcrypt en pre-save hook.
 * 
 * @schema
 * @example
 * ```typescript
 * const user = await User.create({
 *   name: 'John Doe',
 *   email: 'john@gym.com',
 *   password: '123456', // Se hasheará automáticamente
 *   role: 'client',
 *   gymId: gym._id
 * });
 * ```
 */
const UserSchema = new Schema({
  /** Nombre completo del usuario */
  name: { 
    type: String, 
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  
  /** Email único por gimnasio (índice compuesto con gymId) */
  email: { 
    type: String, 
    required: [true, 'El email es requerido'],
    lowercase: true,
    trim: true
  },
  
  /** 
   * Contraseña hasheada con bcrypt.
   * NUNCA se expone en respuestas (eliminada en toJSON transform).
   */
  password: { 
    type: String, 
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'Mínimo 6 caracteres']
  },
  
  /** 
   * Rol del usuario en el sistema.
   * Determina permisos y acceso a funcionalidades.
   */
  role: { 
    type: String, 
    enum: {
      values: ['superadmin', 'admin', 'trainer', 'client'],
      message: '{VALUE} no es un rol válido'
    },
    default: 'client'
  },
  
  // ... más campos con JSDoc
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // CRÍTICO: Nunca exponer contraseña
      return ret;
    }
  }
});

// Pre-save hook para hashear contraseña
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model('User', UserSchema);
```

---

## README.md del Proyecto

### Estructura Recomendada

```markdown
# GymPro

Plataforma SaaS multi-tenant para gestión integral de gimnasios.

## Características

- Gestión de usuarios con 4 roles (superadmin, admin, trainer, client)
- Sistema de asignaciones con rutinas y planes alimenticios personalizados
- Calendario unificado con clases grupales
- Seguimiento de progreso físico
- Punto de venta (POS) con inventario
- Mensajería interna trainer-cliente

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: MongoDB + Mongoose
- **Autenticación**: JWT (jsonwebtoken)
- **UI Components**: Shadcn/UI + Radix UI

## Instalación

### Prerrequisitos

- Node.js 18+ 
- pnpm 10+
- MongoDB 6+

### Setup

1. Clonar repositorio:
```bash
git clone https://github.com/tu-usuario/gympro.git
cd gympro
```

2. Instalar dependencias:
```bash
pnpm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus valores:
```
MONGODB_URI=mongodb://localhost:27017/gympro
JWT_SECRET=tu-secret-super-seguro-de-256-bits
NODE_ENV=development
```

4. Iniciar servidor de desarrollo:
```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

- `pnpm dev` - Servidor de desarrollo
- `pnpm build` - Build de producción
- `pnpm start` - Servidor de producción
- `pnpm lint` - Linter
- `pnpm test` - Tests (próximamente)

## Estructura del Proyecto

```
gympro/
├── app/              # Next.js App Router
│   ├── api/         # API Routes (backend)
│   ├── app/         # Dashboard autenticado
│   └── portal/      # Portales públicos multi-tenant
├── components/       # Componentes React
│   ├── ui/          # Componentes base (Shadcn)
│   ├── admin/       # UI de administrador
│   ├── trainer/     # UI de entrenador
│   └── client/      # UI de cliente
├── lib/             # Lógica de negocio
│   ├── models/      # Modelos de Mongoose
│   ├── auth.ts      # Helpers de autenticación
│   └── mongodb.ts   # Conexión a DB
├── docs/            # Documentación
└── skills/          # Guías de desarrollo
```

## Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md)

## Licencia

MIT
```

---

## Checklist de Documentación

Antes de hacer commit:

- [ ] **Funciones públicas**: Tienen JSDoc con `@param`, `@returns`, `@example`
- [ ] **Componentes**: Props documentadas con tipos TypeScript
- [ ] **API Endpoints**: Anotaciones Swagger (si aplica)
- [ ] **Lógica compleja**: Comentarios explicando "por qué"
- [ ] **Sin comentarios obsoletos**: Eliminar código comentado
- [ ] **README actualizado**: Si se agregan features nuevas
- [ ] **Changelog**: Actualizado con cambios importantes

---

## Herramientas

### Generadores de Documentación

- **TypeDoc** - Genera docs desde JSDoc + TypeScript
- **Swagger UI** - Interfaz interactiva para API
- **Storybook** - Catálogo de componentes UI

### Instalación

```bash
pnpm add -D typedoc swagger-jsdoc swagger-ui-express
```

### Configuración TypeDoc

```json
// typedoc.json
{
  "entryPoints": ["lib/**/*.ts", "components/**/*.tsx"],
  "out": "docs/api",
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeExternals": true
}
```

Generar docs:
```bash
npx typedoc
```

---

## Recursos

- [JSDoc Official](https://jsdoc.app/)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Swagger/OpenAPI Spec](https://swagger.io/specification/)
- [Writing Great Documentation](https://documentation.divio.com/)

---

## Aplicación en GymPro

Este skill debe aplicarse en:
- ✅ Funciones de utilidad complejas
- ✅ Hooks personalizados
- ✅ API endpoints públicos
- ✅ Componentes reutilizables
- ✅ Modelos de datos (schemas)
- ✅ Lógica de negocio crítica
