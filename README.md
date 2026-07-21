# Klarimba Dashboard

Consola de administración B2B de Klarimba (fase 1): empresas, partners ARL y
backoffice de plataforma. Frontend del mockup [docs/dashboard.html](docs/dashboard.html)
recortado a lo que el API respalda hoy, según
[docs/frontend-phase1-map.md](docs/frontend-phase1-map.md).

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, `proxy.ts`)
- **TypeScript** estricto
- **Tailwind CSS v4** + **shadcn/ui** (tema con la paleta Klarimba del mockup)
- **iron-session** — sesión cifrada en cookie httpOnly (los JWT del API nunca
  llegan al navegador)
- **zod** — validación de formularios *y* de todas las respuestas del API
- **react-hook-form** + `@hookform/resolvers`

## Puesta en marcha

```bash
cp .env.example .env.local   # y define SESSION_SECRET (openssl rand -base64 32)
pnpm install
pnpm dev                     # http://localhost:3000
```

Requiere el API corriendo (`../klarimba-api`, por defecto
`http://localhost:8080/api/v1`; configurable con `KLARIMBA_API_URL`).

## Arquitectura

```
src/
├── proxy.ts                   # Middleware: guard de sesión + refresh proactivo del JWT
├── lib/
│   ├── session.ts / session.server.ts   # iron-session (cookie klarimba_session)
│   ├── env.ts                 # Variables de entorno validadas con zod
│   ├── api/
│   │   ├── http.ts            # apiFetch: desenvuelve {data}, valida con zod, ApiError
│   │   ├── schemas.ts         # Schemas zod de entidades y DTOs del API
│   │   ├── auth.ts / organizations.ts / backoffice.ts   # Endpoints tipados
│   ├── permissions.ts         # Réplica de la matriz rol×permiso×scope del API
│   ├── dashboard-context.ts   # Resolución del "modo" (currentMode() con datos reales)
│   └── navigation.ts          # Navegación por modo (company/peoplebasic/portfolio/admin)
└── app/
    ├── login/                 # Login (RHF + zod + server action)
    ├── (dashboard)/
    │   ├── org/[orgId]/       # Overview · users · settings · enterprise · companies · licenses
    │   └── admin/             # Backoffice SA: overview · clients (+detalle) · partners
    └── logout-action.ts
```

### Resolución de contexto (switcher)

`getDashboardContexts()` calca `currentMode()` del mockup con datos reales:

| Modo | Señal |
|---|---|
| `portfolio` | La org es `type: PARTNER` |
| `company` | `TENANT` con add-on `ENTERPRISE` activo (`GET .../entitlements`) |
| `peoplebasic` | `TENANT` sin Enterprise |
| Super Admin | Sondeo de `GET /backoffice/organizations` (403 ⇒ no admin) |

Solo membresías con rol administrativo (`COMPANY_OWNER`/`HR_ADMIN`) generan
contexto; el perfil **Manager queda oculto en fase 1**.

### Autenticación

1. Login → `POST /auth/login` → `{accessToken, refreshAccessToken}` se guardan
   cifrados en la cookie de sesión (iron-session, httpOnly).
2. `proxy.ts` corre en cada request: redirige a `/login` sin sesión y, si el
   access token expira en <60 s, lo renueva contra `/auth/refresh-token` y
   reescribe la cookie.
3. Todas las llamadas al API se hacen desde el servidor (`server-only`) con
   `Authorization: Bearer`.

## Alcance fase 1

Conectado: Usuarios (invitar por email, reenviar, revocar, reactivar, filtro
por estado), Overview de accesos (seatUsage), eje partner (crear empresas
hijas, asignar licencias), backoffice SA (clientes, partners, grants,
entitlement Enterprise, bootstrap de admin, auditoría por organización) y la
resolución del switcher. Oculto (sin backend): métricas de
engagement/bienestar, programas, Intelligence, reportes, facturación,
equipos/sedes, importación CSV y el perfil Manager.

### Gaps conocidos del API (verificados en el código del backend)

1. **`platformRole` no viaja** en el JWT ni en `/auth/me` → el Super Admin se
   detecta sondeando backoffice. Ideal: exponerlo en `AuthMeSerializer`.
2. **No hay `PATCH /organizations/:orgId` para el Owner** (solo backoffice) →
   el formulario de Configuración muestra un mensaje claro si devuelve 404.
3. El **bootstrap del primer admin de una hija** es solo backoffice; la vista
   de Empresas del partner lo comunica.
