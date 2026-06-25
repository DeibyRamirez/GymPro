# Skill: Patrones de Diseño

## Descripción

Guía de patrones de diseño aplicados y recomendados para el proyecto GymPro, con ejemplos prácticos y casos de uso.

## Patrones Creacionales

### 1. Singleton (Conexión a MongoDB)

**Problema**: Evitar múltiples conexiones a la base de datos, especialmente en development con hot-reload.

**Solución**:
```typescript
// lib/mongodb.ts
import mongoose, { Mongoose } from 'mongoose';

declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI no está definido');
}

const cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn; // Reutiliza conexión existente
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
```

**Cuándo usar**:
- Conexiones a bases de datos
- Configuraciones globales
- Caches en memoria

---

### 2. Factory (Creación de CalendarEvents)

**Problema**: Crear eventos de calendario desde múltiples fuentes (assignment, calendar, manual) con configuraciones diferentes.

**Solución**:
```typescript
// lib/factories/CalendarEventFactory.ts
export class CalendarEventFactory {
  /**
   * Crea evento desde Assignment (días de entrenamiento programados)
   */
  static fromAssignment(
    assignment: Assignment, 
    dayOfWeek: number
  ): Partial<CalendarEvent> {
    const scheduleDay = assignment.weeklySchedule.find(
      d => d.dayOfWeek === dayOfWeek
    );
    
    return {
      userId: assignment.clientId,
      trainerId: assignment.trainerId,
      gymId: assignment.gymId,
      assignmentId: assignment._id,
      routineId: scheduleDay?.isRestDay ? null : assignment.routineId,
      mealPlanId: assignment.mealPlanId,
      title: scheduleDay?.title || (scheduleDay?.isRestDay ? 'Descanso' : 'Entrenamiento'),
      type: scheduleDay?.isRestDay ? 'rest' : 'workout',
      source: 'assignment',
      completed: false,
      date: this.calculateDate(assignment.startDate, dayOfWeek)
    };
  }
  
  /**
   * Crea evento de clase grupal (trainer/admin)
   */
  static fromGroupClass(data: GroupClassData): Partial<CalendarEvent> {
    return {
      ...data,
      type: 'class',
      source: 'calendar',
      capacity: data.capacity || 20,
      bookedCount: 0,
      attendanceCode: this.generateAttendanceCode()
    };
  }
  
  /**
   * Crea evento privado (cliente)
   */
  static fromPrivateEvent(data: PrivateEventData): Partial<CalendarEvent> {
    return {
      ...data,
      type: data.type || 'reminder',
      source: 'manual'
    };
  }
  
  private static calculateDate(startDate: Date, dayOfWeek: number): Date {
    const date = new Date(startDate);
    const currentDay = date.getDay();
    const diff = (dayOfWeek - currentDay + 7) % 7;
    date.setDate(date.getDate() + diff);
    return date;
  }
  
  private static generateAttendanceCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

// Uso
const event1 = CalendarEventFactory.fromAssignment(assignment, 1); // Lunes
const event2 = CalendarEventFactory.fromGroupClass({ title: 'Yoga', ... });
const event3 = CalendarEventFactory.fromPrivateEvent({ title: 'Cita médica', ... });
```

**Cuándo usar**:
- Creación de objetos complejos con múltiples configuraciones
- Lógica de inicialización condicional
- Múltiples constructores alternativos

---

### 3. Builder (Creación de Queries Complejas)

**Problema**: Construir queries de MongoDB con múltiples filtros opcionales.

**Solución**:
```typescript
// lib/builders/UserQueryBuilder.ts
export class UserQueryBuilder {
  private filters: Record<string, any> = {};
  private selectFields: string = '';
  private sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
  private populateOptions: any[] = [];
  
  constructor(private gymId: string) {
    this.filters.gymId = gymId;
  }
  
  withRole(role: string) {
    this.filters.role = role;
    return this;
  }
  
  isActive(active: boolean = true) {
    this.filters.isActive = active;
    return this;
  }
  
  withTrainer(trainerId: string) {
    this.filters.trainerId = trainerId;
    return this;
  }
  
  select(fields: string) {
    this.selectFields = fields;
    return this;
  }
  
  sortBy(field: string, order: 'asc' | 'desc' = 'desc') {
    this.sortOptions = { [field]: order === 'asc' ? 1 : -1 };
    return this;
  }
  
  populate(field: string, select?: string) {
    this.populateOptions.push({ path: field, select });
    return this;
  }
  
  async execute() {
    let query = User.find(this.filters);
    
    if (this.selectFields) {
      query = query.select(this.selectFields);
    }
    
    query = query.sort(this.sortOptions);
    
    this.populateOptions.forEach(opt => {
      query = query.populate(opt);
    });
    
    return query.lean();
  }
}

// Uso
const clients = await new UserQueryBuilder(gymId)
  .withRole('client')
  .isActive(true)
  .withTrainer(trainerId)
  .select('name email avatar')
  .populate('trainerId', 'name email')
  .sortBy('name', 'asc')
  .execute();
```

**Cuándo usar**:
- Construcción de objetos complejos paso a paso
- APIs fluidas (method chaining)
- Configuraciones opcionales múltiples

---

## Patrones Estructurales

### 4. Adapter (Transformación de Datos)

**Problema**: MongoDB usa `_id`, pero el frontend espera `id`. Además, nunca debemos exponer contraseñas.

**Solución**:
```typescript
// En cada Schema de Mongoose
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString(); // Adapta _id → id
    delete ret._id;
    delete ret.__v;
    delete ret.password; // NUNCA exponer contraseña
    return ret;
  }
});

// También se puede crear un Adapter explícito
class MongooseToApiAdapter {
  static adapt<T extends { _id: any }>(doc: T): Omit<T, '_id' | '__v'> & { id: string } {
    const { _id, __v, ...rest } = doc;
    return {
      id: _id.toString(),
      ...rest
    } as any;
  }
  
  static adaptMany<T extends { _id: any }>(docs: T[]): Array<Omit<T, '_id' | '__v'> & { id: string }> {
    return docs.map(doc => this.adapt(doc));
  }
}

// Uso
const user = await User.findById(userId);
const adaptedUser = MongooseToApiAdapter.adapt(user.toObject());
```

**Cuándo usar**:
- Integración entre sistemas con diferentes interfaces
- Transformación de formatos de datos
- Compatibilidad entre versiones

---

### 5. Decorator (Higher-Order Components)

**Problema**: Agregar funcionalidad (autenticación, logging) a componentes sin modificarlos.

**Solución**:
```typescript
// components/hoc/withAuth.tsx
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

type AllowedRole = 'superadmin' | 'admin' | 'trainer' | 'client';

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: AllowedRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { user, loading } = useAuth();
    
    // Estado de carga
    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }
    
    // No autenticado
    if (!user) {
      router.push('/login');
      return null;
    }
    
    // No tiene permisos
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Acceso Denegado</h1>
            <p>No tienes permisos para acceder a esta página</p>
          </div>
        </div>
      );
    }
    
    // Usuario autenticado y con permisos
    return <Component {...props} user={user} />;
  };
}

// Uso
const AdminDashboard = withAuth(
  AdminDashboardComponent, 
  ['admin', 'superadmin']
);

const TrainerPanel = withAuth(
  TrainerPanelComponent, 
  ['trainer']
);
```

**HOC para Logging**:
```typescript
export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function LoggedComponent(props: P) {
    useEffect(() => {
      console.log(`[${componentName}] Mounted with props:`, props);
      
      return () => {
        console.log(`[${componentName}] Unmounted`);
      };
    }, [props]);
    
    return <Component {...props} />;
  };
}
```

**Cuándo usar**:
- Agregar funcionalidad cross-cutting (auth, logging, analytics)
- Reutilizar lógica en múltiples componentes
- Separar concerns

---

### 6. Composite (Componentes React)

**Problema**: Construir UIs complejas desde componentes simples.

**Solución**:
```typescript
// components/ui/card.tsx (hojas)
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

// components/client/TrainerInfoCard.tsx (compuesto)
export function TrainerInfoCard({ trainer }: TrainerInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Entrenador</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={trainer.avatar} />
            <AvatarFallback>{trainer.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{trainer.name}</p>
            <p className="text-sm text-muted-foreground">{trainer.email}</p>
          </div>
        </div>
        <Button className="mt-4 w-full">Enviar mensaje</Button>
      </CardContent>
    </Card>
  );
}
```

**Cuándo usar**:
- Construcción de UIs jerárquicas
- Componentes que pueden tener hijos
- Estructuras de árbol (menús, navegación)

---

## Patrones de Comportamiento

### 7. Observer (React State + Effects)

**Problema**: Componentes necesitan reaccionar a cambios en el estado.

**Solución**:
```typescript
// hooks/useAssignment.ts
export function useAssignment(assignmentId: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Observer: Observa cambios en assignmentId
  useEffect(() => {
    let mounted = true;
    
    async function fetchAssignment() {
      try {
        const res = await fetch(`/api/assignments/${assignmentId}`);
        const data = await res.json();
        
        if (mounted) {
          setAssignment(data); // Notifica cambio a observers (componentes)
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchAssignment();
    
    // Cleanup al desmontar
    return () => {
      mounted = false;
    };
  }, [assignmentId]); // Dependencia observada
  
  return { assignment, loading };
}

// Componente que observa
function AssignmentView({ assignmentId }: AssignmentViewProps) {
  const { assignment, loading } = useAssignment(assignmentId);
  
  // Se re-renderiza automáticamente cuando assignment cambia
  if (loading) return <Spinner />;
  if (!assignment) return <NotFound />;
  
  return <div>{assignment.name}</div>;
}
```

**Event Emitter Personalizado**:
```typescript
// lib/events/EventEmitter.ts
type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();
  
  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }
  
  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      this.events.set(
        event, 
        callbacks.filter(cb => cb !== callback)
      );
    }
  }
  
  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }
}

// Uso
const emitter = new EventEmitter();

emitter.on('user:login', (user) => {
  console.log('Usuario logueado:', user.name);
});

emitter.emit('user:login', { name: 'John' });
```

**Cuándo usar**:
- Reactividad (React state)
- Event-driven architecture
- Comunicación entre componentes desacoplados

---

### 8. Strategy (Autenticación Multi-Estrategia)

**Problema**: Soportar múltiples métodos de autenticación (cookie, header).

**Solución**:
```typescript
// lib/auth/strategies.ts
interface AuthStrategy {
  extractToken(req: NextRequest): string | null;
}

class CookieAuthStrategy implements AuthStrategy {
  extractToken(req: NextRequest): string | null {
    return req.cookies.get('auth-token')?.value || null;
  }
}

class HeaderAuthStrategy implements AuthStrategy {
  extractToken(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.replace('Bearer ', '');
  }
}

class AuthContext {
  private strategies: AuthStrategy[] = [
    new CookieAuthStrategy(),
    new HeaderAuthStrategy()
  ];
  
  extractToken(req: NextRequest): string | null {
    for (const strategy of this.strategies) {
      const token = strategy.extractToken(req);
      if (token) return token;
    }
    return null;
  }
}

// Uso en verifyAuth
export async function verifyAuth(req: NextRequest) {
  const authContext = new AuthContext();
  const token = authContext.extractToken(req);
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  // Verificar JWT...
}
```

**Cuándo usar**:
- Algoritmos intercambiables
- Múltiples implementaciones de una interfaz
- Comportamiento configurable en runtime

---

### 9. Template Method (Mongoose Hooks)

**Problema**: Ejecutar lógica antes/después de operaciones de base de datos.

**Solución**:
```typescript
// lib/models/User.ts
UserSchema.pre('save', async function(next) {
  // Template: Se ejecuta ANTES de save()
  
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hashear contraseña
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.post('save', function(doc, next) {
  // Template: Se ejecuta DESPUÉS de save()
  console.log(`Usuario ${doc.email} guardado exitosamente`);
  
  // Aquí podrías enviar emails, notificaciones, etc.
  next();
});

UserSchema.pre('remove', async function(next) {
  // Template: Se ejecuta ANTES de remove()
  
  // Eliminar asignaciones relacionadas
  await Assignment.deleteMany({ clientId: this._id });
  await CalendarEvent.deleteMany({ userId: this._id });
  
  next();
});
```

**Hook Personalizado**:
```typescript
// lib/hooks/useFormSubmit.ts
export function useFormSubmit<T>(
  onSubmit: (data: T) => Promise<void>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: T) => {
    // Template: PRE-submit
    setLoading(true);
    setError(null);
    
    try {
      // Llamada al callback (paso variable)
      await onSubmit(data);
      
      // Template: POST-submit (éxito)
      toast.success('Guardado exitosamente');
    } catch (err) {
      // Template: POST-submit (error)
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error(message);
    } finally {
      // Template: FINALLY
      setLoading(false);
    }
  };
  
  return { handleSubmit, loading, error };
}

// Uso
function MyForm() {
  const { handleSubmit, loading } = useFormSubmit(async (data) => {
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  });
  
  return <form onSubmit={form.handleSubmit(handleSubmit)}>...</form>;
}
```

**Cuándo usar**:
- Operaciones con pasos fijos y pasos variables
- Hooks de ciclo de vida
- Pipelines de procesamiento

---

## Patrones Específicos de GymPro

### 10. Deep Copy (Clonación de Rutinas)

**Problema**: Permitir personalización de rutinas sin afectar plantillas originales.

**Solución**: Ver [patrones/diseno.md](/docs/patrones/diseno.md) para implementación completa.

**Cuándo usar**:
- Objetos complejos con relaciones anidadas
- Necesidad de personalización sin afectar originales
- Trazabilidad requerida (sourceId)

---

### 11. Multi-Tenant Discriminator

**Problema**: Aislar datos de múltiples gimnasios en una sola base de datos.

**Solución**:
```typescript
// Todos los modelos tienen gymId
const UserSchema = new Schema({
  name: String,
  email: String,
  gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true }
});

// Índice para optimizar queries por gimnasio
UserSchema.index({ gymId: 1 });

// TODAS las queries incluyen gymId
const users = await User.find({ gymId: currentGym._id });
const routines = await Routine.find({ gymId: currentGym._id });

// Middleware para agregar gymId automáticamente
UserSchema.pre('save', function(next) {
  if (!this.gymId) {
    throw new Error('gymId is required');
  }
  next();
});
```

**Cuándo usar**:
- Aplicaciones SaaS multi-tenant
- Aislamiento de datos por cliente
- Única instancia, múltiples clientes

---

## Antipatrones a Evitar

### ❌ God Object (Objeto Dios)

```typescript
// ❌ Mal: Clase que hace TODO
class GymManager {
  createUser() { }
  updateUser() { }
  deleteUser() { }
  createRoutine() { }
  updateRoutine() { }
  createAssignment() { }
  processPayment() { }
  sendEmail() { }
  generateReport() { }
  // ... 50 métodos más
}
```

**Solución**: Separar responsabilidades en clases específicas.

---

### ❌ Callback Hell

```typescript
// ❌ Mal
function createAssignment(data, callback) {
  User.findById(data.clientId, (err, client) => {
    if (err) return callback(err);
    
    Routine.findById(data.routineId, (err, routine) => {
      if (err) return callback(err);
      
      cloneRoutine(routine, (err, clonedRoutine) => {
        if (err) return callback(err);
        
        const assignment = new Assignment({ ... });
        assignment.save((err, saved) => {
          if (err) return callback(err);
          callback(null, saved);
        });
      });
    });
  });
}
```

**Solución**: Usar async/await.

---

### ❌ Magic Numbers/Strings

```typescript
// ❌ Mal
if (user.role === 'admin' || user.role === 'superadmin') { }
if (status === 1) { }
```

**Solución**: Usar constantes o enums.

---

## Recursos

- **Design Patterns: Elements of Reusable Object-Oriented Software** (Gang of Four)
- **JavaScript Design Patterns** by Addy Osmani
- **Refactoring Guru** - https://refactoring.guru/design-patterns
- **Patterns.dev** - https://patterns.dev/

---

## Aplicación en GymPro

Este skill debe aplicarse en:
- ✅ Refactoring de código existente
- ✅ Nuevas features complejas
- ✅ Mejoras de arquitectura
- ✅ Resolución de problemas recurrentes
