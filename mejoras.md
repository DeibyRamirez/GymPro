# Especificaciones Técnicas: Sistema Gym Pro (SaaS de Gestión de Gimnasios)

Este documento detalla las funcionalidades requeridas para el sistema de gestión de gimnasios "Gym Pro", enfocado en la automatización, personalización de entrenamientos y generación de ingresos.

## 1. Módulo de Gestión de Usuarios y Roles
El sistema debe manejar cuatro niveles de acceso con permisos específicos:

- **Super Administrador (Dueño del Software):** Gestión de sedes y suscripciones de los gimnasios.
- **Administrador (Dueño del Gym):** Gestión de inventario, ventas, asignación de entrenadores y finanzas.
- **Entrenador:** Creación de rutinas, planes alimenticios y seguimiento de clientes asignados.
- **Cliente:** Visualización de su progreso, rutinas, plan alimenticio y tienda de productos.

## 2. Funcionalidad Core: Rutinas y Clonación (Lógica de Negocio)
El sistema debe permitir una gestión dinámica de entrenamientos para optimizar el tiempo del entrenador.

- **Biblioteca de Plantillas:** El gimnasio debe tener una base de datos de rutinas estándar (ej: "Principiante Mes 1", "Definición Pro").
- **Lógica de Clonación (Deep Copy):**
    - Al asignar una rutina a un cliente, el sistema NO debe vincular la plantilla original.
    - Debe crear una **instancia única** (copia) en la tabla `rutinas_asignadas`.
    - El entrenador podrá editar esta copia (cambiar repeticiones, pesos o ejercicios) específicamente para ese cliente sin afectar la plantilla base.
- **Interfaz de Ejecución:** El cliente debe poder marcar cada serie como "completada" desde su perfil para generar historial.

## 3. Módulo de Nutrición Personalizada
- **Creador de Planes:** Herramienta para que el entrenador desglose comidas por macronutrientes (proteínas, carbohidratos, grasas).
- **Asignación de Objetivos:** Definición de meta calórica diaria según el perfil del cliente (volumen, definición, mantenimiento).

## 4. Módulo de Inventario y Ventas (Monetización)
- **E-commerce Local:** Catálogo de suplementos, accesorios y bebidas disponibles en el gimnasio físico.
- **Control de Stock:** Notificación automática al administrador cuando un producto llegue al umbral mínimo.
- **Sistema de Punto de Venta (POS):** El administrador debe poder registrar ventas rápidas vinculadas al perfil del cliente.

## 5. Módulo de Calendario y Horarios
- **Disponibilidad de Máquinas:** (Opcional/Avanzado) Visualización de horas pico basada en las reservas de los clientes.
- **Agenda de Clases:** Calendario interactivo para clases grupales con sistema de reserva de cupos.
- **Check-in:** Registro de asistencia diaria mediante código QR para validar la vigencia de la membresía.

## 6. Seguimiento de Progreso (Retención de Clientes)
- **Registro Antropométrico:** Formulario para ingresar peso, % de grasa, perímetros (brazo, cintura, etc.).
- **Visualización de Datos:** Gráficos de líneas que muestren la evolución del cliente a lo largo de los meses.
- **Logros:** Sistema de medallas automáticas (ej: "Primer mes cumplido", "10 días seguidos de entreno").

## 7. Requerimientos Técnicos Sugeridos
- **Backend:** Node.js para escalabilidad y manejo de procesos en tiempo real.
- **Frontend:** Responsive Web App (priorizando vista móvil para clientes).
- **Base de Datos:** Estructura relacional para manejar la integridad entre clientes, entrenadores y rutinas clonadas.
- **Gestión de Dependencias:** Uso de `pnpm` para optimizar el almacenamiento y rendimiento en el entorno de desarrollo.

## 8. Estrategia de Monetización del Software
1. **Suscripción Mensual por Gimnasio:** Pago fijo por el uso de la infraestructura.
2. **Comisiones por Transacción:** En caso de integrar pasarelas de pago para membresías online.
3. **Módulos Premium:** Cobro adicional por funcionalidades de IA (ej: generación automática de rutinas basadas en perfil).