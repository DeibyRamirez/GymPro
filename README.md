# Gym Pro

Plataforma SaaS para gestión de gimnasios con arquitectura basada en `Next.js` App Router, `MongoDB` y control de acceso por roles.

## Resumen técnico

Gym Pro centraliza la operación de un gimnasio en una sola aplicación web con cuatro perfiles funcionales:

- `superadmin`: administración global de la plataforma.
- `admin`: operación del gimnasio y gestión de usuarios.
- `trainer`: administración de clientes, rutinas, planes y clases.
- `client`: consumo de rutinas, calendario, progreso y eventos personales.

La aplicación combina frontend en React con backend interno vía Route Handlers, persistiendo datos en MongoDB mediante Mongoose.

## Arquitectura

### Frontend

- `Next.js 16` con App Router.
- `React 19`.
- Componentes reutilizables bajo `components/`.
- UI construida con patrones tipo `shadcn/ui` y `Radix UI`.
- Paneles separados por rol y vistas específicas para rutinas, progreso, mensajes, calendario y reportes.

### Backend

- Route Handlers en `app/api`.
- Autenticación basada en JWT.
- Persistencia con `Mongoose`.
- Validación de permisos por rol en endpoints críticos.
- Respuestas JSON normalizadas para consumo directo desde el frontend.

### Persistencia

- MongoDB como base de datos principal.
- Colecciones principales para:
  - usuarios
  - gimnasios
  - rutinas
  - ejercicios
  - planes alimenticios
  - asignaciones
  - eventos de calendario

## Funcionalidad actual

### Superadmin

- Visión global del sistema.
- Acceso a métricas administrativas.
- Administración de gimnasios y operación general.

### Admin

- Gestión de usuarios del gimnasio.
- Supervisión de trainers y clientes.
- Acceso a estadísticas operativas.
- Control de catálogo y estructura del gimnasio.

### Trainer

- Gestión de clientes asignados.
- Creación y mantenimiento de rutinas.
- Creación y mantenimiento de planes alimenticios.
- Asignación de contenido a clientes.
- Creación de clases grupales.
- Seguimiento de progreso y calendario.

### Client

- Visualización de entrenador asignado.
- Consulta de rutina y plan alimenticio.
- Calendario con:
  - días de entrenamiento
  - días de descanso
  - clases grupales del gimnasio
  - eventos privados del cliente
- Registro de eventos privados en su propio calendario.
- Consulta de progreso y datos de perfil.

## Calendario

El módulo de calendario soporta múltiples fuentes de eventos:

- `assignment`: días derivados de la asignación del cliente.
- `calendar`: eventos del gimnasio creados por trainer/admin.
- `manual`: eventos privados creados por el propio cliente.

### Tipos visuales

- Verde: entrenamiento.
- Azul: descanso.
- Amarillo: clase grupal.
- Violeta: evento privado.

### Comportamiento

- El cliente ve eventos de su asignación y clases grupales del gimnasio.
- El cliente puede crear eventos privados en su propio calendario.
- Los eventos privados se guardan en `CalendarEvent` con `source = manual`.
- El detalle diario muestra título, tipo, hora, cupos y contenido relacionado.

## Backend de calendario

### `GET /api/calendar`

- Retorna eventos filtrados por rol.
- `trainer` ve sus eventos y los de sus clientes.
- `admin` ve todos los eventos del gimnasio.
- `client` ve:
  - sus eventos propios
  - clases grupales del gimnasio
  - eventos privados creados por él mismo

### `POST /api/calendar`

- `trainer` y `admin` pueden crear eventos operativos.
- `client` puede crear solo eventos privados para sí mismo.
- Todos los eventos se almacenan en la colección `CalendarEvent`.

## Modelo de datos

### `CalendarEvent`

Campos principales:

- `title`
- `description`
- `date`
- `type`
- `completed`
- `source`
- `userId`
- `gymId`
- `trainerId`
- `routineId`
- `mealPlanId`
- `assignmentId`
- `capacity`
- `bookedCount`
- `attendanceCode`
- `duration`
- `reminder`

### `Assignment`

- Relación entre cliente y trainer.
- Contiene rutina, plan alimenticio y cronograma semanal.
- Permite proyectar calendario por mes.

### `Routine`

- Rutinas con lista de ejercicios, series, repeticiones y descanso.
- Se usa para renderizar detalles de entrenamiento en el calendario.

### `User`

- Roles: `superadmin`, `admin`, `trainer`, `client`.
- Soporta relación cliente-trainer vía `trainerId`.

## Seguridad

- Autenticación por JWT vía cookie o `Authorization: Bearer`.
- Verificación de usuario activo antes de ejecutar acciones.
- Validación por rol en endpoints de lectura y escritura.
- Los clientes no pueden crear eventos para otros usuarios.

## Infraestructura

- `Next.js` como frontend y backend unificados.
- `MongoDB` para persistencia principal.
- `Mongoose` para modelos y validación de esquema.
- `jsonwebtoken` para autenticación.
- `bcryptjs` para hashing de contraseñas.
- `Vercel` compatible para despliegue.

## Estructura de carpetas

```txt
app/
  api/                 # Route Handlers del backend
  app/                 # Página principal de la aplicación
  portal/              # Portal por gimnasio
components/
  admin/               # UI de administración
  auth/                # Login y registro
  calendar/            # Vista general del calendario
  client/              # Dashboard del cliente
  trainer/             # Panel de trainer
  ui/                  # Componentes base
lib/
  auth.ts              # Usuarios mock y helpers locales
  calendar-data.ts     # Contrato de eventos del calendario
  mongodb.ts           # Conexión a MongoDB
  models/              # Schemas de Mongoose
public/                # Assets estáticos
```

## Observaciones técnicas

- El proyecto ya funciona como producto funcional en varios módulos.
- El mayor foco actual está en mantener consistencia de permisos y contratos de datos entre frontend y backend.
- El calendario ya soporta eventos de asignación, clases grupales y eventos privados del cliente.
