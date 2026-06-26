# Alcance del Proyecto

> **Última actualización:** Junio 26, 2026

## Visión General

GymPro es una plataforma integral de gestión de gimnasios que abarca desde la administración de usuarios hasta el seguimiento detallado del progreso físico de los clientes, con arquitectura multi-tenant para soportar múltiples gimnasios independientes.

## Funcionalidades Implementadas (v1.1)

### 1. Autenticación y Autorización
- [x] Sistema de login/registro con JWT
- [x] 4 roles: superadmin, admin, trainer, client
- [x] Middleware de protección de rutas
- [x] Cookies HTTP-only + Authorization header
- [x] Validación de usuario activo en cada request
- [x] Protección CSRF en operaciones mutables (`assertCsrf`)
- [x] Campo `goal` en perfil de cliente para filtrar plantillas

### 2. Sistema Multi-Tenant
- [x] Subdominios independientes por gimnasio (slug)
- [x] Middleware de detección y reescritura de URLs
- [x] Aislamiento de datos por `gymId`
- [x] Portal público personalizado por gimnasio
- [x] Dashboard de superadmin para gestión global

### 3. Gestión de Usuarios
- [x] CRUD completo de usuarios
- [x] Asignación de roles y gimnasios
- [x] Asignación de entrenadores a clientes
- [x] Perfil con información física (edad, peso, altura, género)
- [x] Objetivos de entrenamiento (`goal`) y nivel de actividad
- [x] Condiciones médicas
- [x] Planes de membresía

### 4. Rutinas de Ejercicio
- [x] Biblioteca de rutinas plantilla (`isTemplate: true`)
- [x] Creación de rutinas con múltiples ejercicios
- [x] Sistema de clonación profunda (`sourceRoutineId`, `isTemplate: false`)
- [x] Personalización sin afectar plantillas originales
- [x] Filtrado por dificultad, tags y meta del cliente
- [x] Configuración de series, repeticiones, descanso por ejercicio
- [x] Imágenes e instrucciones detalladas
- [x] API `?templatesOnly=true` para biblioteca del entrenador
- [x] Edición con normalización de ejercicios poblados (`exercise.name`)

### 5. Planes Alimenticios
- [x] Creador de planes con múltiples comidas
- [x] Desglose de macronutrientes (proteínas, carbohidratos, grasas)
- [x] Calorías totales y por comida
- [x] Horarios de comidas
- [x] Biblioteca de plantillas (`isTemplate`, `sourceMealPlanId`)
- [x] Clonación al asignar programa (copia independiente por cliente)
- [x] Deduplicación en listado de plantillas (mismo nombre + calorías + creador)
- [x] API `?templatesOnly=true` para evitar mostrar clones en biblioteca

### 6. Sistema de Asignaciones y Programas (Fases 1–3)

#### Asignación unificada (trainer)
- [x] Diálogo único **Asignar / Actualizar programa** (`assign-program-dialog.tsx`)
- [x] Rutina + plan alimenticio en un solo paso
- [x] Filtro de plantillas sugeridas según meta del cliente (`goal-tags`)
- [x] Calendario semanal (microciclo) con días activos/descanso
- [x] Modo avanzado: **rutina distinta por día** (`routineTemplateId` por día)
- [x] **POST** crea programa nuevo; **409** si ya hay asignación activa
- [x] **PUT** `/api/assignments/[id]/program` actualiza sin duplicar
- [x] Pre-carga de datos al editar programa existente

#### Servicio de programas (`lib/assignment/program-service.ts`)
- [x] `buildProgramFromTemplates()` — clona rutinas/planes y arma `weeklySchedule`
- [x] Cache de clones por plantilla (evita duplicar la misma rutina en un mismo POST/PUT)
- [x] `mapRoutineExercises()` — proyección de ejercicios con `exerciseId`

#### Completitud diaria — estilo Duolingo (Fase 1)
- [x] Modelo `dayCompletions[]` en Assignment
- [x] `POST/GET /api/assignments/[id]/day-complete`
- [x] Checkboxes entrenamiento / nutrición por día
- [x] Racha (`streak`) calculada en calendario
- [x] UI en `calendar-dashboard.tsx` del cliente

#### Progreso por fecha (Fase 2)
- [x] `routineProgress[]` con `dateKey` por serie completada
- [x] `POST /api/assignments/[id]/progress` acepta `date`
- [x] Cliente marca series ligadas al día del calendario
- [x] Botón **Ir a rutina del día** desde calendario

#### Calendario de asignación (Fase 2–3)
- [x] `GET /api/assignments/[id]/calendar` — proyección mensual
- [x] Rutina **por día** según `weeklySchedule[].routineId` (no solo rutina principal)
- [x] `mealsToday[]` en días con plan alimenticio
- [x] Helper `extractRefId()` para refs MongoDB (`id` vs `_id`, documentos embebidos)

### 7. Calendario Unificado
- [x] Eventos de 3 fuentes: assignment, calendar, manual
- [x] Tipos: workout, meal, rest, assessment, appointment, class
- [x] Clases grupales con capacidad y reservas
- [x] Código de asistencia para check-in
- [x] Permisos por rol (trainer crea operativos, client crea privados)
- [x] Componentes: `calendar-dashboard.tsx` (cliente), `calendar-view.tsx` (genérico)
- [x] Parseo de fechas sin desfase UTC (`lib/calendar/parse-event-date.ts`)

### 8. Seguimiento de Progreso
- [x] Registro de mediciones corporales (peso, grasa, perímetros)
- [x] Historial de mediciones con gráficos
- [x] Visor 3D de progreso corporal (`body-model-viewer.tsx`)
- [x] Progreso de rutinas por ejercicio y por fecha
- [x] Porcentaje de completitud de entrenamientos
- [x] Dashboard de progreso visual
- [x] Exportación de progreso (CSV y PDF)

### 9. Inventario y Punto de Venta (POS)
- [x] CRUD de productos (suplementos, accesorios, bebidas)
- [x] Control de stock con alertas de bajo inventario
- [x] Registro de ventas con múltiples productos
- [x] Métodos de pago: efectivo, tarjeta, transferencia
- [x] Asociación opcional con cliente
- [x] Actualización automática de stock post-venta
- [x] Historial de ventas por gimnasio

### 10. Equipamiento del Gimnasio
- [x] Catálogo de máquinas y equipamiento
- [x] Categorías: cardio, fuerza, funcional, accesorio
- [x] Cantidad disponible
- [x] Imágenes y descripciones
- [x] Muestra en portal público

### 11. Sistema de Mensajería
- [x] Conversaciones trainer-cliente
- [x] Historial de mensajes con timestamps
- [x] Indicador de lectura (readAt)
- [x] Contexto de asignación opcional
- [x] Inbox organizado por conversación

### 12. Notificaciones
- [x] Modelo `Notification` y campana en layout (`notification-bell.tsx`)
- [x] Contador de no leídas (`GET /api/notifications/unread-count`)
- [x] Triggers al crear asignaciones (`notifyAssignmentCreated`)
- [x] Scroll interno en popover; bloqueo de scroll del body mientras está abierto

### 13. Bitácora del Sistema — Admin (nuevo)
- [x] Modelo `ActivityLog` con categorías y acciones tipadas
- [x] `recordActivitySafe()` — registro tolerante a fallos
- [x] `GET /api/activity-log?gymSlug=&category=`
- [x] UI `activity-feed.tsx` en dashboard admin con filtro por tipo
- [x] Instrumentación en rutas: register, routines, meal-plans, assignments, sales, calendar, progress, products, gym-equipment, users, broadcast

### 14. Dashboards por Rol

#### Superadmin
- [x] Visión global de gimnasios
- [x] Métricas administrativas generales
- [x] Gestión de gimnasios (crear, editar, suspender)

#### Admin
- [x] Gestión de usuarios del gimnasio
- [x] Control de inventario y ventas
- [x] Configuración de planes de membresía
- [x] Estadísticas operativas
- [x] Feed de actividad del gimnasio (bitácora)

#### Trainer
- [x] Lista de clientes asignados con filtro activo/sin plan
- [x] Biblioteca de rutinas y planes (solo plantillas)
- [x] Asignar / actualizar programa unificado
- [x] Seguimiento de progreso de clientes
- [x] Creación de clases grupales
- [x] Mensajería con clientes

#### Client
- [x] Dashboard personal con entrenador asignado
- [x] Rutina activa con seguimiento por día
- [x] Plan alimenticio activo
- [x] Calendario con entrenamientos, comidas del día y racha
- [x] Registro de eventos privados
- [x] Progreso físico con gráficos y visor 3D
- [x] Exportación de reportes (CSV / PDF)
- [x] Mensajes con entrenador

### 15. Portal Público
- [x] Landing page personalizada por gimnasio
- [x] Información del gimnasio (datos, galería, ubicación)
- [x] Planes de membresía con precios
- [x] Catálogo de equipamiento
- [x] Formulario de registro

---

## Módulos de Código Relevantes (nuevo)

```
lib/
├── assignment/
│   ├── program-service.ts    # Clonación y armado de programas
│   ├── day-completion.ts     # dateKey, streak, completitud
│   ├── goal-tags.ts          # Filtro por meta del cliente
│   └── ref-id.ts             # Normalización id / _id
├── activity-log/
│   ├── record.ts             # recordActivitySafe()
│   └── types.ts
├── meal-plan/
│   └── templates.ts          # Filtro y deduplicación de plantillas
└── calendar/
    └── parse-event-date.ts   # Fechas sin desfase de zona horaria
```

---

## API de Asignaciones — Resumen

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/assignments` | Lista por rol (paginada) |
| POST | `/api/assignments` | Crear programa (409 si ya hay activo) |
| PUT | `/api/assignments/[id]/program` | Actualizar programa existente |
| GET | `/api/assignments/[id]/calendar` | Calendario mensual proyectado |
| POST/GET | `/api/assignments/[id]/day-complete` | Completitud diaria + racha |
| POST | `/api/assignments/[id]/progress` | Progreso de series (con `date`) |

---

## Funcionalidades Planificadas (Roadmap)

### Completado recientemente (Q2 2026)
- [x] Asignación unificada rutina + plan
- [x] Completitud diaria y rachas
- [x] Actualizar programa sin duplicar asignación
- [x] Rutinas distintas por día de la semana
- [x] Bitácora de actividad admin
- [x] Plantillas vs clones en biblioteca

### Fase siguiente (Q3 2026)
- [ ] Tests automatizados (Jest + RTL)
- [ ] Notificaciones push en tiempo real
- [ ] Limpieza/migración de clones legacy en BD
- [ ] Documentación OpenAPI/Swagger
- [ ] Recordatorios automáticos de entrenamientos

### Fase 4 (Q4 2026)
- [ ] Gestión de membresías con pagos integrados
- [ ] Pasarelas de pago (Stripe, PayPal)
- [ ] Vencimientos y renovaciones automáticas
- [ ] Facturación electrónica

### Fase 5 (Q1 2027)
- [ ] App móvil nativa (iOS/Android)
- [ ] Integración con wearables
- [ ] Recomendaciones automáticas con IA

### Fuera de Alcance (v1.x)
- Integración con hardware biométrico
- Sistema de puntos y gamificación
- Marketplace de entrenadores
- Clases virtuales en vivo (streaming)
- Red social interna

---

## Limitaciones Técnicas Actuales

1. **Sin pagos en línea** — Membresías y ventas no procesan pagos digitales
2. **Sin push nativo** — Notificaciones in-app; no FCM/APNs
3. **Clones legacy** — Planes/rutinas clonados antes de jun/2026 pueden carecer de `sourceMealPlanId` / `isTemplate: false`
4. **Serialización `id` vs `_id`** — Modelos con `toJSON` renombran `_id`; endpoints con `.lean()` devuelven `_id`. El frontend debe usar `doc.id || doc._id`
5. **Sin tests automatizados** — Cobertura 0%
6. **Sin app móvil nativa** — Solo web responsive

---

## Criterios de Aceptación

Para considerar una funcionalidad completa:
- ✅ Backend (API endpoint) implementado
- ✅ Frontend (UI) implementado y responsive
- ✅ Validación de datos en ambos lados
- ✅ Manejo de errores con mensajes descriptivos
- ✅ Permisos por rol aplicados
- ✅ Aislamiento por `gymId` verificado

---

## Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API Routes, Node.js
- **Base de Datos**: MongoDB con Mongoose (14 modelos)
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcryptjs, HTTP-only cookies, CSRF en mutaciones
- **Gráficos**: Recharts
- **Formularios**: react-hook-form + zod
- **UI Components**: Radix UI
- **Deploy**: Vercel (recomendado)

---

## Usuarios Objetivo

1. **Gimnasios boutique** (1 sede, 50–200 clientes)
2. **Cadenas de gimnasios** (2–10 sedes, 500+ clientes)
3. **Entrenadores personales** con espacios compartidos
4. **Box de CrossFit** con clases grupales
5. **Centros de fitness** con servicios adicionales

---

## Métricas de Éxito del Proyecto

- ~98% de funcionalidades core implementadas (post Fases 1–3)
- Tiempo de respuesta de API < 500 ms (promedio en dev)
- 100% de cobertura de roles (superadmin, admin, trainer, client)
- Interfaz responsive en mobile, tablet, desktop
