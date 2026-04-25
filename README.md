# GymPro

Sistema web para gestion de gimnasio, entrenadores y clientes.

## Problema que resuelve

GymPro centraliza la operacion de un gimnasio en un solo lugar:

- Evita el uso de Excel, WhatsApp y notas sueltas para controlar clientes.
- Da trazabilidad a rutinas, planes alimenticios, progreso y eventos.
- Permite a administradores, entrenadores y clientes trabajar con una sola fuente de verdad.
- Reduce errores en asignaciones, seguimiento y comunicacion.

## Propuesta de valor

Este sistema se puede vender a un gimnasio porque permite:

- Controlar usuarios por rol: admin, trainer y client.
- Asignar rutinas y planes alimenticios.
- Consultar estadisticas de operacion.
- Registrar eventos de calendario y seguimiento.
- Mantener el historial de progreso del cliente.

## Estado actual del proyecto

El proyecto ya tiene una base tecnica funcional, pero aun se comporta mas como demo que como producto final.

### Ya existe

- Login y registro en la interfaz.
- Dashboards separados por rol.
- Modelos en MongoDB para usuarios, rutinas, planes, ejercicios, eventos y asignaciones.
- Endpoint de estadisticas del dashboard.
- Autenticacion basada en JWT para el backend.

### Falta o esta incompleto

- CRUD real para rutinas, planes, ejercicios, eventos y asignaciones.
- Flujo completo de autenticacion unificado entre frontend y backend.
- Control real de permisos por rol.
- Persistencia consistente de sesiones y tokens.
- Edicion de perfil, progreso y medidas corporales.
- Seguimiento de asistencia, pagos y membresias.
- Notificaciones y recordatorios reales.
- Reportes exportables.
- Validaciones de negocio mas estrictas.

## Funcionalidad

### Administrador

- Ver usuarios activos.
- Ver metricas generales.
- Administrar trainers y clients.
- Revisar actividad general.

### Entrenador

- Ver clientes asignados.
- Crear y editar rutinas.
- Crear y editar planes alimenticios.
- Asignar contenido a clientes.
- Revisar progreso y eventos.

### Cliente

- Ver su entrenador.
- Ver rutina asignada.
- Ver plan alimenticio asignado.
- Consultar calendario.
- Revisar avance general.
- Actualizar perfil y datos basicos.

## Arquitectura

### Frontend

- `Next.js` con App Router.
- `React 19`.
- Componentes reutilizables en `components/`.
- UI basada en componentes tipo shadcn/Radix.

### Backend

- Route Handlers en `app/api`.
- Autenticacion con `jsonwebtoken`.
- Persistencia con `mongoose`.
- Modelos en `lib/models`.

### Persistencia

- MongoDB para usuarios, rutinas, planes, ejercicios, eventos y asignaciones.

## Estructura de carpetas

```txt
app/
  page.tsx                # Entrada principal de la aplicacion
  layout.tsx              # Layout global y metadata
  globals.css             # Estilos globales
  api/                    # Endpoints del backend
components/
  auth/                   # Login y registro
  admin/                  # Vista y gestion administrativa
  trainer/                # Panel de entrenador
  client/                 # Panel de cliente
  ui/                     # Componentes reutilizables de interfaz
hooks/                    # Hooks compartidos
lib/
  auth.ts                 # Usuarios mock y helpers locales
  mongodb.ts              # Conexion a MongoDB
  models/                 # Schemas de Mongoose
public/                   # Imagenes y recursos estaticos
styles/                   # Estilos adicionales
```

## Integraciones

- MongoDB: base de datos principal.
- JWT: autenticacion y control de acceso.
- bcryptjs: hashing de contrasenas.
- Next.js API Routes: backend interno.
- Vercel Analytics: analitica de uso.

## Mejoras recomendadas para convertirlo en un sistema vendible

### Prioridad alta

- Unificar autenticacion real en frontend y backend.
- Crear CRUD completo para usuarios, rutinas, planes, ejercicios, eventos y asignaciones.
- Reemplazar datos mock por consultas reales a MongoDB.
- Agregar validacion de permisos por rol en cada endpoint.
- Agregar manejo de errores y estados vacios consistentes.

### Prioridad media

- Integrar asistencia y control de entradas.
- Agregar planes de pago, membresias y vencimientos.
- Agregar notificaciones por correo o WhatsApp.
- Agregar historial de progreso con fotos, medidas y peso.
- Agregar reportes y exportacion a PDF/CSV.

### Prioridad baja

- Multisucursal.
- Metas automaticas por cliente.
- Recomendaciones inteligentes de rutina y nutricion.
- App movil o PWA.

## Lógica faltante importante

- Asignar entrenador a cliente con reglas de negocio.
- Evitar sobreasignacion de rutinas y planes.
- Marcar eventos completados y calcular progreso real.
- Calcular asistencia, cumplimiento y evolucion mensual.
- Mantener sesion segura y persistente.

## Objetivo del producto

Construir una plataforma que permita a un gimnasio administrar clientes, entrenadores, rutinas, planes alimenticios y seguimiento diario con informacion centralizada y trazable.

## Roadmap sugerido

1. Completar autenticacion y roles.
2. Implementar CRUDs reales.
3. Agregar progreso, asistencia y reportes.
4. Integrar notificaciones y pagos.
5. Preparar despliegue y documentacion comercial.
