# Patrones de Diseño Implementados

## Patrones Arquitectónicos

### 1. Patrón de Capas (Layered Architecture)

**Descripción**: Separación de responsabilidades en 3 capas horizontales.

**Implementación:**
```
Presentación → Lógica de Negocio → Persistencia
(Components)   (API Routes)         (MongoDB)
```

**Beneficios:**
- Separación de preocupaciones (SoC)
- Facilita testing unitario
- Código más mantenible
- Reutilización de componentes

**Ejemplo:**
```typescript
// CAPA PRESENTACIÓN (components/client/AssignedRoutineCard.tsx)
"use client";
export function AssignedRoutineCard() {
  const [routine, setRoutine] = useState(null);
  
  useEffect(() => {
    fetch('/api/assignments/current') // Llama a lógica de negocio
      .then(res => res.json())
      .then(data => setRoutine(data));
  }, []);
  
  return <Card>{/* UI */}</Card>;
}

// CAPA LÓGICA DE NEGOCIO (app/api/assignments/current/route.ts)
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  const assignment = await Assignment.findOne({ 
    clientId: user._id, 
    status: 'active' 
  }); // Llama a persistencia
  return NextResponse.json(assignment);
}

// CAPA PERSISTENCIA (lib/models/Assignment.ts)
const AssignmentSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'User' },
  routineId: { type: Schema.Types.ObjectId, ref: 'Routine' },
  status: String
});
export default mongoose.model('Assignment', AssignmentSchema);
```

---

### 2. Patrón Multi-Tenant (Discriminador)

**Descripción**: Una sola instancia de la aplicación sirve a múltiples clientes (gimnasios) con datos aislados.

**Estrategia**: Discriminador por campo `gymId` en todos los modelos.

**Implementación:**
```typescript
// Middleware detecta subdominio
middleware.ts:
  alpha.gympro.com → /portal/alpha

// Component busca gimnasio
const gym = await Gym.findOne({ slug: 'alpha' });

// Todas las queries filtran por gymId
const users = await User.find({ gymId: gym._id });
const routines = await Routine.find({ gymId: gym._id });
```

**Ventajas:**
- Un solo codebase para múltiples gimnasios
- Costos reducidos de infraestructura
- Actualizaciones sincronizadas
- Aislamiento de datos por diseño

**Diagrama:**
```
alpha.gympro.com     beta.gympro.com
       ↓                    ↓
    Middleware         Middleware
       ↓                    ↓
  Gym(slug=alpha)    Gym(slug=beta)
       ↓                    ↓
  gymId=123          gymId=456
       ↓                    ↓
User.find({          User.find({
  gymId: 123           gymId: 456
})                   })
```

---

### 3. Patrón Repository (Implícito con Mongoose)

**Descripción**: Mongoose Models actúan como repositorios que encapsulan el acceso a datos.

**Implementación:**
```typescript
// lib/models/User.ts (Repository)
class UserModel {
  static async findByEmail(email: string, gymId: string) {
    return this.findOne({ email: email.toLowerCase(), gymId });
  }
  
  static async createWithHashedPassword(userData: UserData) {
    // Hash automático en pre-save hook
    return this.create(userData);
  }
}

// Uso en API Route
const user = await User.findByEmail(email, gymId);
```

**Beneficios:**
- Centraliza lógica de consultas
- Facilita cambios en la estructura de datos
- Mejora testabilidad (se puede mockear el modelo)

---

### 4. Patrón de Clonación (Deep Copy)

**Descripción**: Clonar objetos complejos (rutinas + ejercicios) para permitir personalización sin afectar plantillas originales.

**Problema Resuelto:**
- Trainer crea rutina "Hipertrofia 4 días"
- Se asigna a 10 clientes diferentes
- Cada cliente necesita ajustes personalizados
- Modificar una copia NO debe afectar a las demás

**Implementación:**
```typescript
// app/api/assignments/route.ts
async function cloneRoutine(originalRoutineId: string, userId: string, gymId: string) {
  // 1. Buscar rutina original
  const originalRoutine = await Routine.findById(originalRoutineId)
    .populate('exercises.exercise');
  
  // 2. Clonar ejercicios
  const clonedExercises = await Promise.all(
    originalRoutine.exercises.map(async (ex) => {
      const clonedExercise = new Exercise({
        ...ex.exercise.toObject(),
        _id: undefined, // Genera nuevo ID
        sourceExerciseId: ex.exercise._id, // Trazabilidad
        isTemplate: false,
        createdBy: userId,
        gymId
      });
      await clonedExercise.save();
      return {
        exercise: clonedExercise._id,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        instructions: ex.instructions,
        order: ex.order
      };
    })
  );
  
  // 3. Clonar rutina con ejercicios clonados
  const clonedRoutine = new Routine({
    ...originalRoutine.toObject(),
    _id: undefined,
    sourceRoutineId: originalRoutineId, // Trazabilidad
    isTemplate: false,
    exercises: clonedExercises,
    createdBy: userId,
    gymId
  });
  
  await clonedRoutine.save();
  return clonedRoutine._id;
}

// Uso al crear Assignment
const clonedRoutineId = await cloneRoutine(body.routineId, trainerId, gymId);
const assignment = new Assignment({
  clientId,
  trainerId,
  routineId: clonedRoutineId, // Usa la copia, no el original
  gymId
});
```

**Ventajas:**
- Personalización sin riesgos
- Historial preservado (sourceRoutineId)
- Plantillas reutilizables
- Trazabilidad completa

---

## Patrones de Comportamiento

### 5. Patrón Strategy (Autenticación)

**Descripción**: Múltiples estrategias de autenticación (cookie vs header).

**Implementación:**
```typescript
export async function verifyAuth(req: NextRequest) {
  // Estrategia 1: Cookie HTTP-only (preferida)
  let token = req.cookies.get('auth-token')?.value;
  
  // Estrategia 2: Header Authorization (fallback para mobile)
  if (!token) {
    const authHeader = req.headers.get('authorization');
    token = authHeader?.replace('Bearer ', '');
  }
  
  if (!token) throw new Error('No token provided');
  
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.userId);
  
  if (!user || !user.isActive) throw new Error('User not active');
  
  return user;
}
```

---

### 6. Patrón Observer (React State + Effects)

**Descripción**: Los componentes "observan" cambios en el estado y reaccionan automáticamente.

**Implementación:**
```typescript
function CalendarView() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Observer: Observa cambios en selectedDate
  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch(`/api/calendar?date=${selectedDate.toISOString()}`);
      const data = await res.json();
      setEvents(data); // Notifica cambio
    }
    fetchEvents();
  }, [selectedDate]); // Dependencia observada
  
  return (
    <div>
      <DatePicker 
        date={selectedDate} 
        onSelect={setSelectedDate} // Trigger cambio
      />
      <EventList events={events} /> {/* Se re-renderiza automáticamente */}
    </div>
  );
}
```

---

### 7. Patrón Template Method (Mongoose Hooks)

**Descripción**: Define el esqueleto de un algoritmo, delegando pasos específicos a subclases/hooks.

**Implementación:**
```typescript
UserSchema.pre('save', async function(next) {
  // Template: Ejecuta ANTES de guardar
  if (!this.isModified('password')) return next();
  
  // Paso específico: Hashear contraseña
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.post('save', function(doc, next) {
  // Template: Ejecuta DESPUÉS de guardar
  console.log(`Usuario ${doc.email} guardado exitosamente`);
  // Aquí podrías enviar email de bienvenida, etc.
  next();
});

// Uso (ejecuta template automáticamente)
const user = new User({ email: 'test@test.com', password: '123456' });
await user.save(); // pre-save → save → post-save
```

---

## Patrones de Creación

### 8. Patrón Singleton (Conexión MongoDB)

**Descripción**: Garantiza una única instancia de conexión a la base de datos.

**Implementación:**
```typescript
// lib/mongodb.ts
declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
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
    cached.promise = mongoose.connect(MONGODB_URI); // Crea nueva
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Beneficios:**
- Evita múltiples conexiones en development (hot-reload)
- Optimiza pool de conexiones
- Reduce latencia

---

### 9. Patrón Factory (Creación de CalendarEvents)

**Descripción**: Método centralizado para crear eventos de calendario según fuente.

**Implementación:**
```typescript
class CalendarEventFactory {
  static createFromAssignment(assignment: Assignment, dayOfWeek: number) {
    const startDate = new Date(assignment.startDate);
    const eventDate = this.getNextDayOfWeek(startDate, dayOfWeek);
    
    const scheduleDay = assignment.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);
    
    return new CalendarEvent({
      userId: assignment.clientId,
      trainerId: assignment.trainerId,
      gymId: assignment.gymId,
      assignmentId: assignment._id,
      routineId: scheduleDay.isRestDay ? null : assignment.routineId,
      mealPlanId: assignment.mealPlanId,
      title: scheduleDay.title || (scheduleDay.isRestDay ? 'Día de descanso' : 'Entrenamiento'),
      date: eventDate,
      type: scheduleDay.isRestDay ? 'rest' : 'workout',
      source: 'assignment',
      completed: false
    });
  }
  
  static createGroupClass(data: GroupClassData) {
    return new CalendarEvent({
      ...data,
      type: 'class',
      source: 'calendar',
      capacity: data.capacity || 20,
      bookedCount: 0,
      attendanceCode: this.generateCode()
    });
  }
  
  static createPrivateEvent(data: PrivateEventData) {
    return new CalendarEvent({
      ...data,
      type: data.type || 'reminder',
      source: 'manual'
    });
  }
  
  private static generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  private static getNextDayOfWeek(startDate: Date, targetDay: number): Date {
    const date = new Date(startDate);
    const currentDay = date.getDay();
    const diff = (targetDay - currentDay + 7) % 7;
    date.setDate(date.getDate() + diff);
    return date;
  }
}

// Uso
const events = assignment.weeklySchedule.map(day => 
  CalendarEventFactory.createFromAssignment(assignment, day.dayOfWeek)
);
```

---

## Patrones Estructurales

### 10. Patrón Composite (Componentes React)

**Descripción**: Componer objetos en estructuras de árbol para representar jerarquías.

**Implementación:**
```typescript
// Componentes base (hojas)
function Button() { /* ... */ }
function Input() { /* ... */ }
function Card() { /* ... */ }

// Componentes compuestos (nodos)
function FormField({ children }) {
  return <div className="form-field">{children}</div>;
}

function Form({ children }) {
  return <form>{children}</form>;
}

// Componente complejo (árbol)
function RoutineCreator() {
  return (
    <Card>
      <Form>
        <FormField>
          <Input placeholder="Nombre de la rutina" />
        </FormField>
        <FormField>
          <Select options={difficulties} />
        </FormField>
        <Button>Guardar</Button>
      </Form>
    </Card>
  );
}
```

---

### 11. Patrón Adapter (Transformación de Datos)

**Descripción**: Convierte la interfaz de una clase en otra que los clientes esperan.

**Implementación:**
```typescript
// Backend devuelve _id, frontend espera id
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id; // Adapta _id → id
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Nunca exponer
    return ret;
  }
});

// Uso
const user = await User.findById(userId);
res.json(user); // Automáticamente adaptado
// Frontend recibe: { id: "123", name: "John", ... }
```

---

### 12. Patrón Decorator (Higher-Order Components)

**Descripción**: Agregar funcionalidad a componentes sin modificarlos.

**Implementación:**
```typescript
// HOC para proteger rutas
function withAuth(Component, allowedRoles) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();
    
    if (loading) return <Spinner />;
    
    if (!user) {
      redirect('/login');
      return null;
    }
    
    if (!allowedRoles.includes(user.role)) {
      return <Forbidden />;
    }
    
    return <Component {...props} user={user} />;
  };
}

// Uso
const AdminDashboard = withAuth(AdminDashboardComponent, ['admin', 'superadmin']);
```

---

## Patrones de Validación

### 13. Patrón de Validación Multicapa

**Descripción**: Validar datos en múltiples capas para seguridad en profundidad.

**Implementación:**

**Capa 1: Frontend (react-hook-form + zod)**
```typescript
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres')
});

function LoginForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  
  const onSubmit = async (data) => {
    await fetch('/api/auth/login', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  };
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

**Capa 2: Backend (validación de permisos)**
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Validar campos requeridos
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
  }
  
  // Lógica de login...
}
```

**Capa 3: Base de Datos (Mongoose schema)**
```typescript
const UserSchema = new Schema({
  email: { 
    type: String, 
    required: [true, 'Email es requerido'],
    validate: {
      validator: (v) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
      message: 'Email inválido'
    }
  },
  password: { 
    type: String, 
    required: true,
    minlength: [6, 'Mínimo 6 caracteres']
  }
});
```

---

## Patrones de Optimización

### 14. Patrón de Índices Compuestos

**Descripción**: Optimizar queries frecuentes con índices en múltiples campos.

**Implementación:**
```typescript
// Índice compuesto para búsquedas por usuario y fecha
CalendarEventSchema.index({ userId: 1, date: 1 });

// Query optimizada (usa el índice)
const events = await CalendarEvent.find({
  userId: currentUser._id,
  date: { $gte: startDate, $lte: endDate }
}).sort({ date: 1 });

// Índice único compuesto
UserSchema.index({ email: 1, gymId: 1 }, { unique: true });
// Permite mismo email en diferentes gimnasios
```

---

### 15. Patrón de Populate (Carga Lazy)

**Descripción**: Cargar relaciones bajo demanda en lugar de eager loading.

**Implementación:**
```typescript
// Sin populate (solo IDs)
const assignment = await Assignment.findById(id);
// { clientId: "abc123", trainerId: "def456", routineId: "ghi789" }

// Con populate (carga relaciones)
const assignment = await Assignment.findById(id)
  .populate('clientId', 'name email avatar') // Solo campos necesarios
  .populate('trainerId', 'name email')
  .populate({
    path: 'routineId',
    populate: { 
      path: 'exercises.exercise', // Populate anidado
      select: 'name muscleGroups difficulty'
    }
  });
// {
//   clientId: { name: "John", email: "john@example.com", avatar: "..." },
//   trainerId: { name: "Jane", email: "jane@example.com" },
//   routineId: {
//     name: "Hipertrofia 4 días",
//     exercises: [
//       { exercise: { name: "Press banca", muscleGroups: ["chest"], ... } }
//     ]
//   }
// }
```

---

## Resumen de Patrones

| Patrón | Tipo | Uso en GymPro |
|--------|------|---------------|
| Layered Architecture | Arquitectónico | Separación Presentación/Lógica/Persistencia |
| Multi-Tenant | Arquitectónico | Aislamiento por `gymId` |
| Repository | Creacional | Mongoose Models |
| Deep Copy (Clonación) | Creacional | Rutinas y ejercicios personalizables |
| Strategy | Comportamiento | Autenticación (cookie vs header) |
| Observer | Comportamiento | React State + useEffect |
| Template Method | Comportamiento | Mongoose pre/post hooks |
| Singleton | Creacional | Conexión MongoDB |
| Factory | Creacional | CalendarEvent según fuente |
| Composite | Estructural | Componentes React |
| Adapter | Estructural | Transformación _id → id |
| Decorator (HOC) | Estructural | withAuth para proteger rutas |
| Validación Multicapa | Seguridad | Frontend + Backend + DB |
| Índices Compuestos | Optimización | Queries frecuentes |
| Populate (Lazy Loading) | Optimización | Carga de relaciones |

---

## Principios SOLID Aplicados

### Single Responsibility Principle (SRP)
- Cada componente tiene una responsabilidad única
- Ejemplo: `TrainerInfoCard` solo muestra info del trainer

### Open/Closed Principle (OCP)
- Componentes abiertos a extensión, cerrados a modificación
- Ejemplo: `Button` con variantes (primary, secondary, destructive)

### Liskov Substitution Principle (LSP)
- Componentes base (ui/) pueden sustituirse sin romper funcionalidad
- Ejemplo: Cualquier `Button` puede reemplazar a otro

### Interface Segregation Principle (ISP)
- Props específicas por componente, no interfaces gigantes
- Ejemplo: `CardProps` vs `ButtonProps` (no `ComponentProps` genérico)

### Dependency Inversion Principle (DIP)
- Componentes dependen de abstracciones (props), no de implementaciones concretas
- Ejemplo: `<Card>` no sabe de dónde vienen sus datos
