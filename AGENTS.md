<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Guía para agentes de IA

Última actualización: 2026-09-23

Klarimba Dashboard: backoffice web B2B de Klarimba. Lo usan el **Super Admin** de plataforma (`/admin`: clientes, partners, grants, entitlements) y los **owners / HR admins** de cada organización (`/org/:orgId`: usuarios, invitaciones, empresas hijas, licencias, configuración). Consume el API de `../klarimba-api` (NestJS); repo hermano, las features suelen tocar ambos.

Stack: Next.js 16.2 (App Router, Server Components, Server Actions, `proxy.ts`), React 19, TypeScript estricto, Tailwind v4 + shadcn/ui, iron-session, zod 4, react-hook-form, sonner, Playwright.

Contexto cross-repo (api/app/dashboard: contratos, roles, `hasAppAccess`, entitlement, decisiones vigentes): `../CLAUDE.md` del workspace (se carga solo). Contexto de dominio B2B (fuente de verdad): `../klarimba-api/docs/b2b-feature.md` (modelo) y `../klarimba-api/docs/b2b-guia-operativa.md` (operación). En este repo: `docs/frontend-phase1-map.md` (qué vista tiene backend y qué se oculta) y `docs/pendientes-integracion.md` (backlog cross-repo). `docs/dashboard.html` es el mockup estático de diseño, no documentación.

## Comandos

```bash
pnpm dev         # next dev → http://localhost:3000 (requiere el API en KLARIMBA_API_URL)
pnpm build       # next build
pnpm start       # next start (build de producción)
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm e2e         # playwright test (ver Tests) · pnpm e2e:ui abre el runner
```

Variables de entorno (`.env.example` → `.env.local`, git-ignored): `KLARIMBA_API_URL` (con prefijo `/api/v1`; default `http://localhost:8080/api/v1`), `SESSION_SECRET` (≥32 caracteres, obligatorio), `E2E_EMAIL` / `E2E_PASSWORD` (solo e2e). Las valida zod en `src/lib/env.ts`; `proxy.ts` y `session.ts` leen `process.env` directo porque corren fuera de `server-only`.

## Estructura de `src/`

```
src/
├── proxy.ts                 # Guard de sesión + refresh proactivo del JWT (equivale a middleware en Next 16)
├── app/
│   ├── login/               # page + login-form (RHF) + actions.ts (server action)
│   ├── (dashboard)/         # layout con sidebar; error/loading/not-found propios
│   │   ├── page.tsx         # "/" → redirige al primer contexto
│   │   ├── org/[orgId]/     # overview · users · invitations · settings · enterprise · companies · licenses
│   │   └── admin/           # backoffice SA: overview · clients (+[orgId]) · partners · content (panel de contenido)
│   ├── api/content/upload/  # route handler de subida del panel (fuera del matcher de proxy.ts)
│   ├── logout-action.ts, error.tsx, global-error.tsx, not-found.tsx, layout.tsx (Toaster)
├── components/ ui/ (shadcn) · layout/ (sidebar, page-header, error-state) · dashboard/ (table-pagination, status-pill, seat-usage-card) · brand/
├── components/content/     # editor del panel de contenido: formularios por tipo de step (step-forms/), historial, import/export
└── lib/ api/ (http, schemas, content-schemas, auth, organizations, backoffice, content) · content/ (step-types, validate, content-state) · session(.server).ts · env.ts · dashboard-context.ts · navigation.ts · permissions.ts · action-result.ts · format.ts · clipboard.ts
```

## Next 16: lo que difiere de tu memoria

- `src/proxy.ts` (export default `proxy` + `config.matcher`) reemplaza a `middleware.ts`.
- `params` y `searchParams` de las páginas son **Promise**: siempre `await` (p. ej. `org/[orgId]/users/page.tsx:22-33`).
- Los error boundaries reciben `unstable_retry`, no `reset` (`app/error.tsx`, `app/(dashboard)/error.tsx`, `app/global-error.tsx`).
- Ante cualquier duda de API, leer `node_modules/next/dist/docs/` antes de escribir código.

## Auth y contextos

- Login (`app/login/actions.ts`): `POST /auth/login` → `{accessToken, refreshAccessToken}` sellados en la cookie httpOnly `klarimba_session` (iron-session, TTL 14 días, `session.ts`). Los JWT nunca llegan al navegador. 400 y 401 del API se muestran como "Credenciales incorrectas" (`actions.ts:34`); `?next=` solo se sigue si empieza por `/` y no por `//` (anti open-redirect, `actions.ts:51`).
- `proxy.ts`: sin sesión → `/login?next=…`; con sesión en `/login` → `/`; si el access token expira en <60 s, renueva contra `POST /auth/refresh-token` con header `x-refresh-token` (`proxy.ts:22-23`, mismo contrato en `lib/api/auth.ts:20-36`) y reescribe la cookie; si el refresh falla → `/login?expired=1` y borra la cookie. El logout envía `Authorization: Bearer` + `x-refresh-token` y destruye la sesión aunque el API falle.
- `getDashboardContexts()` (`lib/dashboard-context.ts`, envuelto en `React.cache`): `GET /me/organizations` + `GET /auth/me`. `superAdmin = me.platformRole === "SUPER_ADMIN"` (línea 72). Solo membresías `ACTIVE` con rol ≠ `MEMBER` generan contexto (74-79); por cada una consulta `/organizations/:id/entitlements` para decidir el modo (N+1 conocido).
- Modos (`lib/navigation.ts`): `DashboardMode = "company" | "peoplebasic" | "portfolio"` (PARTNER → portfolio; TENANT con add-on ENTERPRISE activo → company; si no → peoplebasic). El backoffice no es un modo: `ADMIN_NAV` aparte y `admin/layout.tsx:12` hace `notFound()` si no es super admin.
- `/` redirige al primer contexto de org o a `/admin` (`(dashboard)/page.tsx`). `requireOrgContext(orgId, modes?)` → `notFound()` si la org no es tuya o la vista no aplica al modo. Un 401 al resolver el layout → `/login?expired=1` (`(dashboard)/layout.tsx:22-23`).

## Data fetching y server actions

- Solo desde el servidor: `apiFetch` / `apiFetchPage` (`lib/api/http.ts`, `server-only`) añaden `Authorization: Bearer` desde la cookie, envían `cache: "no-store"`, desenvuelven `{ data, pagination, metadata }` y validan `data` con el zod `schema` obligatorio. Fallo de zod → `ApiError(500, …, "SchemaMismatch")` con `console.error` de los issues (145-155); red caída → `ApiError(503)`; `pagination` se parsea tolerante (`null` si no llega). Los wrappers tipados viven en `lib/api/{auth,organizations,backoffice}.ts`; los schemas en `lib/api/schemas.ts`.
- Server actions devuelven `ActionResult<T>` (`{ok:true,data?} | {ok:false,error}`, `lib/action-result.ts`). `toActionError(error)` se llama **solo desde el `catch`**: ante 401 hace `redirect("/login?expired=1")`, y `redirect` lanza `NEXT_REDIRECT`, que un `try` se tragaría (8-16). Otros errores no-`ApiError` se relanzan.
- Cliente: formularios con react-hook-form + `zodResolver` sobre los input schemas de `schemas.ts`; resultado por toast de sonner (`<Toaster>` en `app/layout.tsx`). `form.watch()` en varios formularios genera warnings del React Compiler en `pnpm lint`: aceptados (no migrar de pasada).

## Panel de contenido (`/admin/content`)

Solo Super Admin. Edita en sitio el contenido sembrado del API (`/backoffice/content`, módulo `content-admin`; doc de reglas en `../klarimba-api/docs/content-admin-panel.md`): mundos y mapas (nombre), misiones (nombre, mood, celebratoria) y steps (formulario por tipo en `components/content/step-forms/`, que sigue los tipos de los seeders del API, o JSON avanzado). Se edita solo español; el API retraduce en/it y, si Google falla (`Translation Failed`), `saveWithTranslation` ofrece reintentar en modo `SKIP`. Toda escritura manda la `version` del GET (409 si otro guardó antes). Historial y revertir en la pestaña Historial y en `/admin/content/history`.

Dos excepciones a las convenciones de abajo, a propósito:
- **Subida de archivos** (`src/app/api/content/upload/route.ts`): el navegador hace `fetch` a ese route handler (no al API) y este reenvía el multipart **en streaming** al API con el JWT de la sesión. Está fuera del matcher de `proxy.ts` porque con proxy activo Next guarda el body en memoria y lo trunca a 10 MB (`proxyClientMaxBodySize`); por eso valida y renueva la sesión por su cuenta.
- **Schemas** del panel en `lib/api/content-schemas.ts` (no en `schemas.ts`) porque también los importan componentes cliente para tipar; el contenido de los steps se valida como objeto libre (el contrato por tipo lo valida el API).

Las fechas del panel se pintan con `LocalDateTime` (zona del navegador) para no discrepar con el render del servidor.

## Tablas y paginación

Paginación de servidor con `PAGE_SIZE = 20` por vista (users, invitations, admin/clients, admin/partners), estado en la URL: `?page=` (1-based) y filtros `?status=` (users, invitations) / `?type=` (clients). Los contadores de chips y KPIs son sondas `limit=1` que leen `pagination.total` (`countOrganizationUsers`, `countInvitations`, `countBackofficeOrganizations`). `TablePagination` (`components/dashboard/table-pagination.tsx`) degrada a un aviso de posible truncamiento si `pagination` es `null`.

## Permisos (gotcha cross-repo)

`src/lib/permissions.ts` es una **réplica manual** de la matriz rol × permiso × scope (`own` / `parent`) de `../klarimba-api/src/modules/organizations/domain/services/organization-permission.service.ts`. Solo decide qué mostrar; el API es la autoridad. Si la matriz cambia en el API, replicarla aquí. Roles de organización: `COMPANY_OWNER`, `HR_ADMIN`, `MEMBER` (sin consola en fase 1); rol de plataforma: `SUPER_ADMIN`.

## Contrato del API que se asume

- Prefijo `/api/v1` en `KLARIMBA_API_URL`; respuestas envueltas en `{ data, pagination?, metadata? }`.
- Errores: 422 con `message[]` de class-validator (`{property, constraints}`) → `http.ts` los aplana en un string; errores de dominio `{ message, error, metadata }`.
- Fechas ISO string **o** unix (segundos/millis): schemas con `z.union([z.string(), z.number()])` y `lib/format.ts` (`parseApiDate`, `formatApiDate` en es-CO).
- `pagination` puede faltar (API sin desplegar): la UI degrada, no rompe.

## shadcn/ui

`components.json`: style `radix-nova`, monopaquete `radix-ui`, iconos lucide, CSS en `src/app/globals.css`, alias `@/components`, `@/lib`, `@/components/ui`. El alias `hooks: "@/hooks"` está declarado pero `src/hooks/` no existe (créalo si un componente lo necesita). Añadir componentes con `pnpm dlx shadcn add <componente>`; los generados van a `src/components/ui/`.

## Tests

- No hay runner de unit tests (pendiente decidir Vitest/Jest, ver `docs/pendientes-integracion.md` §2.2).
- E2E Playwright (`e2e/`, `playwright.config.ts`): 6 tests (5 en `users.spec.ts`, 1 en `invitations.spec.ts`), chromium, `workers: 1`. `webServer` ejecuta `pnpm build && pnpm start` en `:3000`. Corre contra un API **real** (dev) y **escribe** (crea/revoca invitaciones y códigos; correos a `@example.com`): nunca apuntar a producción. Sin `E2E_EMAIL`/`E2E_PASSWORD` la suite se salta con `test.skip`.

## Convenciones

- UI hardcodeada en español (sin i18n); docs en español; commits Conventional Commits en inglés (`feat(scope): …`), como en el historial.
- Nada de `fetch` al API desde componentes cliente: los datos entran por Server Components y las mutaciones por server actions.
- Toda respuesta nueva del API necesita su schema zod en `schemas.ts` (o `content-schemas.ts` para el panel de contenido) y un wrapper en `lib/api/`.

## Gotchas

- Al cambiar el contrato del API (campos, matriz de permisos, envelope) buscar la contraparte en `../klarimba-api` y viceversa; `docs/pendientes-integracion.md` registra lo que sigue abierto entre ambos repos.
- `SESSION_SECRET` <32 chars lanza en `getSessionOptions()` en tiempo de request, no en build. La cookie sellada guarda ambos JWT: si supera ~4 KB el navegador la descarta en silencio; `warnIfSessionCookieTooLarge` avisa por log tras login y refresh.
- `(dashboard)/loading.tsx` abre el stream antes de que un `page.tsx` llame a `notFound()`: `/org/<uuid-inexistente>` responde 200 con `noindex` aunque la UI muestre el not-found.
- El comentario de `admin/layout.tsx:5` ("detectado por sondeo del API") está desactualizado: hoy se lee `platformRole` de `/auth/me`.
- `pnpm e2e` levanta el build de producción (no `next dev`) porque el overlay de errores de Next se interpone con los diálogos (`playwright.config.ts:37-39`).
