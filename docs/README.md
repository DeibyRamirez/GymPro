# Documentación del Proyecto GymPro

Esta carpeta contiene la documentación completa del proyecto GymPro, organizada por categorías para facilitar la comprensión del sistema.

## Estructura de Documentación

### 📋 [Problema](./problema/)
Define el problema que GymPro resuelve y el contexto del proyecto.

**Contenido:**
- [definicion.md](./problema/definicion.md) - Contexto, problemas identificados, solución propuesta, beneficiarios y métricas de éxito

**Cuándo consultar:** Al onboarding de nuevos miembros del equipo o para entender el "por qué" del proyecto.

---

### 🎯 [Alcance](./alcance/)
Define qué está incluido y qué no en el proyecto.

**Contenido:**
- [funcionalidades.md](./alcance/funcionalidades.md) - Funcionalidades implementadas, roadmap, stack tecnológico, usuarios objetivo

**Cuándo consultar:** Para entender el estado actual del proyecto y qué features están disponibles.

---

### 🏗️ [Arquitectura](./arquitectura/)
Describe la arquitectura técnica del sistema.

**Contenido:**
- [sistema.md](./arquitectura/sistema.md) - Arquitectura de capas, multi-tenant, modelos de datos, diagramas, flujos de datos

**Cuándo consultar:** Al diseñar nuevas features, hacer refactoring o integrar con el sistema.

---

### 🎨 [Patrones](./patrones/)
Catálogo de patrones de diseño utilizados en el proyecto.

**Contenido:**
- [diseno.md](./patrones/diseno.md) - Patrones arquitectónicos, creacionales, estructurales, de comportamiento, ejemplos prácticos

**Cuándo consultar:** Al resolver problemas de diseño, refactorizar código complejo o implementar nuevas funcionalidades.

---

### 🧪 [Pruebas](./pruebas/)
Estrategia de testing y calidad del código.

**Contenido:**
- [estrategia.md](./pruebas/estrategia.md) - Pirámide de pruebas, tipos de tests, casos de prueba críticos, configuración

**Cuándo consultar:** Al implementar tests, configurar CI/CD o establecer estándares de calidad.

---

### 📊 [Evaluación](./evaluacion/)
Evaluación del estado actual del proyecto.

**Contenido:**
- [estado-actual.md](./evaluacion/estado-actual.md) - Funcionalidades completadas, evaluación técnica, bugs conocidos, deuda técnica, métricas

**Cuándo consultar:** Para auditorías, planificación de sprints o presentaciones a stakeholders.

---

## Navegación Rápida

### Para Nuevos Desarrolladores

1. Comienza con [Problema > definicion.md](./problema/definicion.md) para entender el "por qué"
2. Lee [Alcance > funcionalidades.md](./alcance/funcionalidades.md) para conocer el "qué"
3. Estudia [Arquitectura > sistema.md](./arquitectura/sistema.md) para entender el "cómo"
4. Revisa [Patrones > diseno.md](./patrones/diseno.md) para aprender las soluciones estándar
5. Consulta [Evaluación > estado-actual.md](./evaluacion/estado-actual.md) para conocer el estado

### Para Product Owners

- **Ver progreso:** [Evaluación > estado-actual.md](./evaluacion/estado-actual.md)
- **Entender features:** [Alcance > funcionalidades.md](./alcance/funcionalidades.md)
- **Conocer roadmap:** [Alcance > funcionalidades.md](./alcance/funcionalidades.md#roadmap)

### Para Arquitectos

- **Diseño del sistema:** [Arquitectura > sistema.md](./arquitectura/sistema.md)
- **Patrones utilizados:** [Patrones > diseno.md](./patrones/diseno.md)
- **Escalabilidad:** [Evaluación > estado-actual.md](./evaluacion/estado-actual.md#escalabilidad)

### Para QA Engineers

- **Estrategia de testing:** [Pruebas > estrategia.md](./pruebas/estrategia.md)
- **Casos críticos:** [Pruebas > estrategia.md](./pruebas/estrategia.md#casos-criticos)
- **Bugs conocidos:** [Evaluación > estado-actual.md](./evaluacion/estado-actual.md#bugs-conocidos)

---

## Mantener la Documentación Actualizada

### Cuándo Actualizar

- **Problema/Alcance:** Al cambiar la visión del producto o agregar/quitar features
- **Arquitectura:** Al hacer cambios significativos en la estructura técnica
- **Patrones:** Al adoptar nuevos patrones o identificar antipatrones
- **Pruebas:** Al cambiar la estrategia de testing o agregar nuevos tipos de tests
- **Evaluación:** Al final de cada sprint o milestone importante

### Cómo Actualizar

1. Crear una rama para la actualización de docs
2. Modificar los archivos .md correspondientes
3. Actualizar diagramas si es necesario (usar Mermaid, diagrams.net)
4. Hacer PR con etiqueta `docs`
5. Solicitar review del equipo

### Estilo de Escritura

- **Claro y conciso:** Evitar jerga innecesaria
- **Ejemplos de código:** Incluir ejemplos prácticos siempre que sea posible
- **Diagramas visuales:** Usar diagramas para explicar conceptos complejos
- **Links cruzados:** Referenciar otros documentos cuando sea relevante
- **Actualizaciones marcadas:** Usar notas como `(Actualizado: 2026-05-21)` en secciones modificadas

---

## Herramientas Recomendadas

### Editores Markdown
- **VS Code** con extensión "Markdown All in One"
- **Typora** - Editor visual de Markdown
- **Obsidian** - Para documentación compleja con links

### Diagramas
- **Mermaid** - Diagramas como código (soportado por GitHub)
- **diagrams.net** (draw.io) - Diagramas visuales
- **Excalidraw** - Diagramas tipo sketch

### Validación
- **markdownlint** - Linter para Markdown
- **write-good** - Verificador de legibilidad

---

## Estructura de un Buen Documento

```markdown
# Título Principal

## Visión General
Resumen de 2-3 párrafos sobre el tema.

## Secciones Detalladas

### Subsección 1
Explicación detallada con ejemplos.

### Subsección 2
Más contenido...

## Ejemplos Prácticos
\`\`\`typescript
// Código de ejemplo
\`\`\`

## Recursos Adicionales
- Link 1
- Link 2

## Conclusión
Resumen y próximos pasos.
```

---

## FAQ sobre Documentación

### ¿Qué tan detallada debe ser?

**Suficiente para que alguien nuevo entienda sin ayuda externa**, pero no tanto que se vuelva obsoleta rápidamente.

### ¿Debo documentar código privado/interno?

**No en estos docs.** Estos documentos son de alto nivel. El código interno debe documentarse con comentarios JSDoc.

### ¿Qué hago si encuentro documentación obsoleta?

**Actualízala inmediatamente** o crea un issue para que alguien lo haga. La documentación obsoleta es peor que no tener documentación.

### ¿Debo documentar decisiones de diseño rechazadas?

**Sí, en un archivo de ADR (Architecture Decision Records)** para evitar repetir debates en el futuro.

---

## Plantillas

### Template para Nuevas Features

```markdown
# Feature: [Nombre]

## Descripción
¿Qué hace esta feature?

## Problema que Resuelve
¿Por qué es necesaria?

## Implementación
### Frontend
- Componentes creados
- Hooks utilizados

### Backend
- Endpoints nuevos
- Modelos modificados

### Base de Datos
- Schemas nuevos
- Migraciones

## Testing
- Tests unitarios
- Tests de integración
- Tests E2E

## Documentación Relacionada
- Link a otros docs relevantes
```

### Template para Bugs Críticos

```markdown
# Bug: [Título]

## Severidad
Crítico / Alto / Medio / Bajo

## Descripción
Qué está fallando.

## Pasos para Reproducir
1. Paso 1
2. Paso 2
3. Resultado incorrecto

## Comportamiento Esperado
Qué debería suceder.

## Solución Implementada
Cómo se solucionó.

## Prevención
Qué medidas se tomaron para evitar que vuelva a ocurrir.
```

---

## Contribuir

Si tienes sugerencias para mejorar la documentación:

1. Crea un issue con etiqueta `docs`
2. Describe qué falta o qué está confuso
3. Si es posible, propón una mejora
4. El equipo revisará y asignará prioridad

---

## Licencia

Esta documentación es parte del proyecto GymPro y es propiedad del equipo de desarrollo.

Uso interno únicamente. No distribuir sin autorización.
