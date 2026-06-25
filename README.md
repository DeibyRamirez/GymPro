# GymPro

Plataforma SaaS multi-tenant para gestión integral de gimnasios.

## Requisitos

- Node.js 20+
- pnpm 10+
- MongoDB (local o Atlas)

## Inicio rápido

```bash
# 1. Clonar e instalar
pnpm install

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 3. Arrancar en desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `MONGODB_URI` | Sí | Connection string de MongoDB |
| `JWT_SECRET` | Sí | Secret para firmar tokens (string largo y aleatorio) |
| `ADMIN_SECRET_KEY` | Sí* | Clave para crear el primer admin vía API |
| `NODE_ENV` | No | `development` / `production` |

\* Necesaria solo para el bootstrap inicial del administrador.

## Primer administrador

No hay credenciales hardcodeadas. Crear el primer admin:

```bash
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "name": "Admin",
    "email": "admin@tugym.com",
    "password": "tu-password-seguro",
    "secretKey": "TU_ADMIN_SECRET_KEY"
  }'
```

Luego inicia sesión en `/login` con ese email y contraseña.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción (TypeScript estricto) |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Verificación TypeScript |
| `pnpm test` | Tests unitarios (Jest) |
| `pnpm test:coverage` | Tests con cobertura |

## Roles

| Rol | Acceso |
|-----|--------|
| `superadmin` | Todos los gimnasios, métricas globales |
| `admin` | Su gimnasio: usuarios, inventario, ventas |
| `trainer` | Sus clientes, rutinas, planes, clases |
| `client` | Rutina, calendario, progreso, mensajes |

## Multi-tenant (subdominios)

```
alpha.localhost:3000  →  portal del gimnasio "alpha"
localhost:3000        →  landing SaaS principal
```

En producción: `alpha.gympro.com` → `/portal/alpha/*`

## API — paginación

Los listados soportan query params uniformes:

```
GET /api/users?page=1&limit=20
GET /api/products?page=1&limit=50
GET /api/assignments?trainerId=...&page=1&limit=20
```

Respuesta:

```json
{
  "users": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 98,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

- `page` mínimo: 1 (default: 1)
- `limit` default: 50, máximo: 100

## Estructura del proyecto

```
app/
  api/           # Route Handlers (REST)
  app/           # Dashboard post-login
  portal/[slug]/ # Portal por gimnasio
  superadmin/    # Panel global
components/      # UI por feature (admin, trainer, client…)
lib/
  auth-server.ts # Auth centralizada (verifyAuth, RBAC)
  pagination.ts  # Paginación uniforme
  env.ts         # Validación de secrets
  models/        # Schemas Mongoose (12 modelos)
docs/            # Documentación técnica del proyecto
```

## Seguridad (resumen)

- JWT en cookie HTTP-only o header `Authorization: Bearer`
- Rate limiting en login/registro
- CSRF en mutaciones críticas
- Aislamiento por `gymId` (multi-tenant)
- Audit log en acciones sensibles

Detalle en `docs/` y comentarios en `lib/auth-server.ts`.

## Despliegue

Compatible con Vercel. Configurar las variables de entorno en el panel del hosting antes del deploy.

## Documentación adicional

- [docs/README.md](docs/README.md) — índice completo
- [docs/arquitectura/sistema.md](docs/arquitectura/sistema.md) — arquitectura
- [docs/evaluacion/estado-actual.md](docs/evaluacion/estado-actual.md) — estado del proyecto
