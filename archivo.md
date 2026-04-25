# Archivo de Revision y Construccion

Documento de seguimiento para convertir GymPro en un sistema listo para gimnasio.

## Objetivo general

Crear una plataforma que permita administrar la operacion diaria de un gimnasio con clientes, entrenadores, rutinas, nutricion, asistencia y analitica.

## Que se debe lograr

- Centralizar usuarios por rol.
- Guardar informacion real en base de datos.
- Permitir que el entrenador gestione clientes y planes.
- Permitir que el cliente vea su avance y su plan.
- Dar al admin control total de la operacion.

## Lo que falta crear

### Base tecnica

- Auth real con login, registro, logout y persistencia de sesion.
- Guardado seguro del token.
- Middleware o proteccion de rutas por rol.
- Manejo unificado de errores.

### Modulos de negocio

- CRUD de usuarios.
- CRUD de rutinas.
- CRUD de ejercicios.
- CRUD de planes alimenticios.
- CRUD de asignaciones.
- CRUD de eventos de calendario.
- Perfil de cliente con medidas y objetivo.

### Seguimiento

- Progreso de peso y medidas.
- Fotos de progreso.
- Asistencia a entrenamientos.
- Cumplimiento de rutinas y comidas.
- Historial por fechas.

### Operacion del gimnasio

- Membresias y pagos.
- Vencimientos y renovaciones.
- Notificaciones y recordatorios.
- Reportes exportables.

## Problemas que resuelve

- Desorden operativo.
- Falta de seguimiento del cliente.
- Dificultad para medir avances.
- Perdida de tiempo en gestion manual.
- Informacion dispersa en varias herramientas.

## Mejoras por prioridad

### Alta

- Unificar backend y frontend.
- Reemplazar mock data.
- Implementar permisos por rol.
- Completar endpoints faltantes.

### Media

- Dashboard con metricas reales.
- Agenda y recordatorios.
- Progreso fisico del cliente.
- Exportacion de datos.

### Baja

- Multi sede.
- App movil.
- Recomendaciones automatizadas.

## Criterios de exito

- Un gimnasio puede administrar su operacion sin hojas de calculo.
- El entrenador puede hacer seguimiento real de sus clientes.
- El cliente puede consultar su plan y progreso.
- El admin puede ver el estado general del negocio.

## Pendientes de revision tecnica

- Consistencia entre modelos y UI.
- Uso real de `auth-token` en cookies o headers, pero no ambos sin criterio.
- Validacion de datos antes de guardar.
- Manejo de estados vacios y carga.
- Limpieza de datos mock cuando ya no sean necesarios.

## Ruta de trabajo sugerida

1. Auth y permisos.
2. CRUDs principales.
3. Progreso y calendario.
4. Pagos y membresias.
5. Reportes y notificaciones.
6. Preparacion comercial para venta.
