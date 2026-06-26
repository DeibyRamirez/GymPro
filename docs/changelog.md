# Changelog — GymPro

Registro de cambios relevantes del producto y la documentación.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.1.0] — 2026-06-26

### Añadido

#### Módulo de programas (Fases 1–3)
- Completitud diaria estilo Duolingo: `dayCompletions[]`, racha, checkboxes entrenamiento/nutrición
- `POST/GET /api/assignments/[id]/day-complete`
- Asignación unificada: rutina + plan en un paso (`assign-program-dialog.tsx`)
- Progreso de series por fecha (`dateKey` en `routineProgress`)
- `GET /api/assignments/[id]/calendar` con comidas del día y rutina por weekday
- Rutinas distintas por día (`routineTemplateId` en `weeklySchedule`)
- `PUT /api/assignments/[id]/program` — actualizar programa sin duplicar asignación
- `POST /api/assignments` devuelve **409** si el cliente ya tiene programa activo
- `lib/assignment/program-service.ts` — `buildProgramFromTemplates()`, cache de clones
- Filtro de plantillas por meta del cliente (`goal-tags.ts`)

#### Bitácora admin
- Modelo `ActivityLog`, `recordActivitySafe()`, `GET /api/activity-log`
- UI `activity-feed.tsx` en dashboard admin
- Instrumentación en rutas API principales

#### Planes alimenticios
- `sourceMealPlanId` e `isTemplate` en `MealPlan`
- Clonación al asignar programa
- `GET /api/meal-plans?templatesOnly=true` + deduplicación de plantillas

#### Utilidades
- `lib/assignment/ref-id.ts` — normalización `id` / `_id`
- `lib/calendar/parse-event-date.ts` — fechas sin desfase UTC
- `lib/meal-plan/templates.ts` — filtro y deduplicación

### Corregido
- Asignación siempre hacía POST → 409; frontend ahora usa PUT con `getDocumentId()`
- Calendario 500 al resolver rutinas pobladas (`.toString()` en documentos)
- Biblioteca de planes ocultaba plantillas válidas (filtro `$nin` incorrecto)
- Duplicados visibles de "Plan Muscular" en biblioteca del trainer
- Warning React keys en comidas del plan (`meal.id` inexistente)
- Edición de rutina/plan no cargaba campos (ejercicios poblados, `useEffect` al abrir)
- Scroll del popover de notificaciones

### Documentación
- Actualizados todos los docs en `docs/` a v1.1
- Añadido este changelog

---

## [1.0.0] — 2026-05-21

### Añadido
- Autenticación JWT multi-rol (superadmin, admin, trainer, client)
- Multi-tenant por `gymId` y subdominio (`/portal/[slug]`)
- CRUD usuarios, rutinas, ejercicios, planes alimenticios
- Sistema de asignaciones con clonación de rutinas
- Calendario unificado (assignment, calendar, manual)
- Clases grupales con reservas y check-in
- Seguimiento corporal, gráficos, exportación CSV/PDF
- Visor 3D de progreso corporal
- Inventario, POS, equipamiento del gym
- Mensajería trainer-cliente
- Notificaciones in-app (campana)
- Dashboards por rol y portal público
- Documentación inicial en `docs/`

---

## Próximo (planeado)

### [1.2.0] — Q3 2026
- [ ] Tests automatizados (Jest + RTL) — cobertura mínima 70% en `lib/assignment/`
- [ ] Migración BD: marcar clones legacy (`isTemplate: false`)
- [ ] Normalizar `id` + `_id` en respuestas API
- [ ] OpenAPI / Swagger
- [ ] Notificaciones push

### [1.3.0] — Q4 2026
- [ ] Pagos en línea (Stripe)
- [ ] Membresías con vencimiento automático

---

## Cómo actualizar este archivo

Al cerrar un milestone o sprint:
1. Añadir sección `[X.Y.Z] — YYYY-MM-DD` bajo la más reciente
2. Clasificar en **Añadido**, **Corregido**, **Cambiado**, **Eliminado**
3. Actualizar `docs/README.md` si cambia el índice
4. Sincronizar `docs/evaluacion/estado-actual.md` si cambia el estado general
