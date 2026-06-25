# Alcance del Proyecto

## Visión General

GymPro es una plataforma integral de gestión de gimnasios que abarca desde la administración de usuarios hasta el seguimiento detallado del progreso físico de los clientes, con arquitectura multi-tenant para soportar múltiples gimnasios independientes.

## Funcionalidades Implementadas (v1.0)

### 1. Autenticación y Autorización
- [x] Sistema de login/registro con JWT
- [x] 4 roles: superadmin, admin, trainer, client
- [x] Middleware de protección de rutas
- [x] Cookies HTTP-only + Authorization header
- [x] Validación de usuario activo en cada request

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
- [x] Objetivos de entrenamiento y nivel de actividad
- [x] Condiciones médicas
- [x] Planes de membresía

### 4. Rutinas de Ejercicio
- [x] Biblioteca de rutinas reutilizables
- [x] Creación de rutinas con múltiples ejercicios
- [x] Sistema de clonación profunda (deep copy)
- [x] Personalización sin afectar plantillas originales
- [x] Filtrado por dificultad, grupos musculares, equipo
- [x] Configuración de series, repeticiones, descanso por ejercicio
- [x] Imágenes e instrucciones detalladas

### 5. Planes Alimenticios
- [x] Creador de planes con múltiples comidas
- [x] Desglose de macronutrientes (proteínas, carbohidratos, grasas)
- [x] Calorías totales y por comida
- [x] Horarios de comidas
- [x] Biblioteca compartida entre entrenadores

### 6. Sistema de Asignaciones
- [x] Conecta cliente + entrenador + rutina + plan alimenticio
- [x] Programación semanal de entrenamientos
- [x] Días de descanso configurables
- [x] Duración de 1 a 52 semanas
- [x] Estados: active, completed, pending, cancelled
- [x] Registro de progreso con porcentaje de completitud
- [x] Seguimiento de series completadas por ejercicio

### 7. Calendario Unificado
- [x] Eventos de 3 fuentes: assignment, calendar, manual
- [x] Tipos: workout, meal, rest, assessment, appointment, reminder, class
- [x] Clases grupales con capacidad y reservas
- [x] Código de asistencia para check-in
- [x] Permisos por rol (trainer crea operativos, client crea privados)
- [x] Visualización con código de colores
- [x] Filtrado por fecha, tipo, usuario

### 8. Seguimiento de Progreso
- [x] Registro de mediciones corporales (peso, grasa, perímetros)
- [x] Historial de mediciones con gráficos
- [x] Progreso de rutinas por ejercicio
- [x] Porcentaje de completitud de entrenamientos
- [x] Dashboard de progreso visual

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

### 12. Dashboards por Rol

#### Superadmin
- [x] Visión global de gimnasios
- [x] Métricas administrativas generales
- [x] Gestión de gimnasios (crear, editar, suspender)

#### Admin
- [x] Gestión de usuarios del gimnasio
- [x] Control de inventario y ventas
- [x] Configuración de planes de membresía
- [x] Estadísticas operativas

#### Trainer
- [x] Lista de clientes asignados
- [x] Biblioteca de rutinas y planes
- [x] Creación y asignación de contenido
- [x] Seguimiento de progreso de clientes
- [x] Creación de clases grupales
- [x] Mensajería con clientes

#### Client
- [x] Dashboard personal con entrenador asignado
- [x] Rutina activa con seguimiento
- [x] Plan alimenticio activo
- [x] Calendario con entrenamientos y clases
- [x] Registro de eventos privados
- [x] Progreso físico con gráficos
- [x] Mensajes con entrenador

### 13. Portal Público
- [x] Landing page personalizada por gimnasio
- [x] Información del gimnasio (datos, galería, ubicación)
- [x] Planes de membresía con precios
- [x] Catálogo de equipamiento
- [x] Formulario de registro

## Funcionalidades Planificadas (Roadmap)

### Fase 2 (Q3 2026)
- [ ] Dashboard con métricas en tiempo real
- [ ] Sistema de notificaciones push
- [ ] Recordatorios automáticos de entrenamientos
- [ ] Exportación de datos (CSV, PDF)
- [ ] Informes de progreso automáticos

### Fase 3 (Q4 2026)
- [ ] Gestión de membresías con pagos integrados
- [ ] Pasarelas de pago (Stripe, PayPal)
- [ ] Vencimientos y renovaciones automáticas
- [ ] Facturación electrónica
- [ ] Métricas financieras avanzadas

### Fase 4 (Q1 2027)
- [ ] App móvil nativa (iOS/Android)
- [ ] Integración con wearables (Apple Health, Garmin, Fitbit)
- [ ] Recomendaciones automáticas con IA
- [ ] Análisis predictivo de retención

### Fuera de Alcance (v1.0)
- Integración con hardware biométrico (torniquetes, lectores)
- Sistema de puntos y gamificación
- Marketplace de entrenadores
- Clases virtuales en vivo (streaming)
- Red social interna

## Limitaciones Técnicas Actuales

1. **No hay sistema de pagos**: Las membresías y ventas no procesan pagos en línea
2. **Sin notificaciones push**: Recordatorios solo visibles al abrir la app
3. **Sin app móvil nativa**: Solo web responsive
4. **Sin integración con wearables**: Datos ingresados manualmente
5. **Sin análisis avanzado**: Reportes básicos, sin ML/IA

## Criterios de Aceptación

Para considerar una funcionalidad completa:
- ✅ Backend (API endpoint) implementado y probado
- ✅ Frontend (UI) implementado y responsive
- ✅ Validación de datos en ambos lados
- ✅ Manejo de errores con mensajes descriptivos
- ✅ Permisos por rol aplicados
- ✅ Documentación básica en código

## Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API Routes, Node.js
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcryptjs, HTTP-only cookies
- **Gráficos**: Recharts
- **Formularios**: react-hook-form + zod
- **UI Components**: Radix UI (40+ primitivos)
- **Deploy**: Vercel (recomendado)

## Usuarios Objetivo

1. **Gimnasios boutique** (1 sede, 50-200 clientes)
2. **Cadenas de gimnasios** (2-10 sedes, 500+ clientes)
3. **Entrenadores personales** con espacios compartidos
4. **Box de CrossFit** con clases grupales
5. **Centros de fitness** con servicios adicionales (spa, nutrición)

## Métricas de Éxito del Proyecto

- 95% de funcionalidades core implementadas
- Tiempo de respuesta de API < 500ms (promedio)
- 0 errores críticos en producción
- 100% de cobertura de roles (superadmin, admin, trainer, client)
- Interfaz responsive en mobile, tablet, desktop
