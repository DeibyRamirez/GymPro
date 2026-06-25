# Skills de Desarrollo

Esta carpeta contiene guías detalladas de mejores prácticas para el desarrollo profesional del proyecto GymPro.

## Skills Disponibles

### 1. [Código Limpio](./clean-code.md)
Principios y prácticas para escribir código limpio, mantenible y profesional.

**Incluye:**
- Nombres significativos
- Funciones pequeñas y enfocadas
- Evitar comentarios innecesarios
- Principio DRY (Don't Repeat Yourself)
- Manejo de errores consistente
- Validación temprana (Early Return)
- Checklist de código limpio

**Cuándo usar:** En TODOS los desarrollos nuevos y refactoring.

---

### 2. [Documentación](./documentation.md)
Guía completa para documentar código de forma efectiva.

**Incluye:**
- Comentarios en línea (cuándo y cómo)
- JSDoc para funciones públicas
- Documentación de componentes React
- Documentación de API (Swagger/OpenAPI)
- Documentación de modelos (Mongoose)
- Estructura de README.md
- Herramientas de generación automática (TypeDoc)

**Cuándo usar:** Al crear funciones públicas, componentes reutilizables, API endpoints y módulos complejos.

---

### 3. [Patrones de Diseño](./design-patterns.md)
Catálogo de patrones de diseño aplicados en GymPro.

**Incluye:**
- **Patrones Creacionales:** Singleton, Factory, Builder
- **Patrones Estructurales:** Adapter, Decorator, Composite
- **Patrones de Comportamiento:** Observer, Strategy, Template Method
- **Patrones Específicos:** Deep Copy (Clonación), Multi-Tenant
- Antipatrones a evitar
- Ejemplos prácticos en el proyecto

**Cuándo usar:** Al diseñar nuevas funcionalidades, refactorizar código complejo o resolver problemas arquitectónicos.

---

### 4. [Seguridad](./security.md)
Prácticas de seguridad para proteger la aplicación contra amenazas comunes.

**Incluye:**
- **Autenticación:** Contraseñas seguras (bcrypt), JWT, Rate Limiting
- **Autorización:** RBAC, validación de ownership
- **Validación:** Sanitización, Zod, prevención de inyección
- **Protección contra Ataques:** XSS, CSRF, SQL/NoSQL Injection, SSRF
- **Manejo de Archivos:** Validación de uploads, almacenamiento seguro
- **Logging y Auditoría:** Eventos de seguridad
- **Configuración de Producción:** Variables de entorno, headers de seguridad
- Checklist de seguridad completo

**Cuándo usar:** SIEMPRE. La seguridad es crítica en TODOS los aspectos del desarrollo.

---

## Cómo Usar Estos Skills

### Durante el Desarrollo

1. **Antes de escribir código:**
   - Revisa el skill de **Patrones de Diseño** para elegir la mejor solución
   - Revisa el skill de **Seguridad** para conocer las validaciones necesarias

2. **Mientras escribes código:**
   - Aplica los principios de **Código Limpio**
   - Implementa las prácticas de **Seguridad** correspondientes

3. **Después de escribir código:**
   - Documenta usando la guía de **Documentación**
   - Verifica el checklist de **Código Limpio**
   - Verifica el checklist de **Seguridad**

### Durante Code Reviews

Usa estos skills como referencia para:
- Verificar que el código cumple con estándares
- Sugerir mejoras basadas en patrones reconocidos
- Validar que se implementaron medidas de seguridad

### Durante Refactoring

Consulta los skills para:
- Identificar antipatrones y reemplazarlos
- Aplicar patrones de diseño apropiados
- Mejorar la documentación existente
- Fortalecer la seguridad

---

## Orden de Prioridad

Para nuevos desarrolladores en el proyecto, sugerimos estudiar en este orden:

1. **Seguridad** ← CRÍTICO, nunca negociable
2. **Código Limpio** ← Fundamentos de calidad
3. **Documentación** ← Facilita mantenimiento
4. **Patrones de Diseño** ← Soluciones avanzadas

---

## Mantener los Skills Actualizados

Estos skills deben evolucionar con el proyecto:

- Al descubrir nuevos patrones útiles → Agregar a **Patrones de Diseño**
- Al implementar nuevas medidas de seguridad → Agregar a **Seguridad**
- Al estandarizar nuevas prácticas → Agregar a **Código Limpio**
- Al adoptar nuevas herramientas de docs → Agregar a **Documentación**

---

## Recursos Adicionales

### Libros Recomendados
- **Clean Code** by Robert C. Martin
- **Design Patterns: Elements of Reusable OO Software** (Gang of Four)
- **The Pragmatic Programmer** by Hunt & Thomas
- **Refactoring** by Martin Fowler

### Sitios Web
- [OWASP](https://owasp.org/) - Seguridad web
- [Refactoring Guru](https://refactoring.guru/) - Patrones de diseño
- [Patterns.dev](https://patterns.dev/) - Patrones modernos
- [JavaScript Info](https://javascript.info/) - Fundamentos de JS

### Cursos
- [Epic React](https://epicreact.dev/) - React avanzado
- [Testing JavaScript](https://testingjavascript.com/) - Testing completo
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Contribuir

Si encuentras un patrón, práctica o técnica que debería estar documentada:

1. Crea un issue describiendo la propuesta
2. Envía un PR agregando la sección correspondiente
3. Incluye ejemplos prácticos del proyecto
4. Agrega referencias a documentación oficial

---

## Licencia

Estos skills son parte del proyecto GymPro y están disponibles para todo el equipo de desarrollo.

Siéntete libre de adaptarlos a tus necesidades, pero siempre manteniendo los estándares de calidad y seguridad.
