# Pendientes de integración — Backend y Frontend

> Backlog para que el dashboard quede plenamente integrado y funcionando.
> Complementa [frontend-phase1-map.md](./frontend-phase1-map.md) (qué se conecta en fase 1)
> y el README (arquitectura). Los hallazgos de backend están **verificados
> leyendo el código de `../klarimba-api`**, no solo su documentación.

Prioridades: 🔴 bloqueante o degrada la experiencia hoy · 🟡 importante, hay
workaround · 🟢 mejora / fase 2.

---

## 1. Cambios necesarios en el backend (`klarimba-api`)

### 1.1 ✅ RESUELTO — `platformRole` expuesto en `/auth/me`

- **Estado**: implementado en el API (`AuthMeSerializer` expone `platformRole`,
  `src/modules/auth/presentation/serializers/auth-me.serializer.ts:101`; el
  guard lo lee fresco de DB vía `JwtStrategy` en cada request).
- **Frontend**: ya migrado — [dashboard-context.ts](../src/lib/dashboard-context.ts)
  lee `platformRole` de `/auth/me`; el sondeo `isSuperAdmin()` fue eliminado de
  [backoffice.ts](../src/lib/api/backoffice.ts).

### 1.2 ✅ RESUELTO — `PATCH /organizations/:orgId` para el Company Owner

- **Estado**: implementado en el API (`organization-admin.controller.ts:89`,
  `@OrganizationProtected(MANAGE_ORGANIZATION)`, DTO restringido a `{ name }`).
  El frontend ya llama a esa ruta; el rename funciona.
- **Frontend**: fallback del 404 eliminado de `renameOrganizationAction`;
  `updateOrganization` org-scoped ahora tipa solo `{ name }`. Nota: `status` NO
  se acepta en la ruta org-scoped (la whitelist del ValidationPipe lo descarta
  en silencio); cambiar el estado sigue siendo solo backoffice.

### 1.2b ✅ RESUELTO (2026-07-21) — contrato de `GET /organizations/:orgId/users`

- **Era el bloqueante real de fase 1**: la vista consolidada omitía `id` (todas
  las filas), `identifier` (filas de membresía) y `membershipId` (filas de
  invitación) — `JSON.stringify` elimina claves `undefined` y
  `organizationUserSchema` del dashboard las exige presentes → toda la página
  de Usuarios moría con SchemaMismatch en el primer render.
- **Fix aplicado en el API**: `OrganizationUserView` ahora declara todas las
  claves como requeridas-nullable (el compilador fuerza el contrato) y los
  mappers de `list-organization-users.useCase.ts` emiten `null` explícito;
  `id` = id de la membresía o de la invitación según la fuente.

### 1.2c ✅ RESUELTO (2026-07-29) — `invitationCode` en `GET /organizations/:orgId/users`

- **Necesidad**: el correo de invitación que envía el API **no lleva link, lleva
  el código** (`mail/organizations/invitation.hbs` lo imprime en grande). Para
  que el equipo pueda repartirlo a mano cuando el correo no llega, la consola
  necesita mostrarlo y copiarlo desde la tabla de Usuarios.
- **Cambio aplicado en el API**: `OrganizationUserView` declara
  `invitationCode: string | null`, el mapper de invitaciones emite
  `invitation.code` y el de membresías `null` (ya canjeada), y
  `OrganizationUserSerializer` lo expone. Evita que el frontend tenga que
  cruzar `/users` con `/invitations` (dos listados con paginación
  independiente).
- **Frontend**: columna "Código" con copia al portapapeles en
  [users-table.tsx](../src/app/(dashboard)/org/%5BorgId%5D/users/users-table.tsx).
  El campo se valida como `nullish` en `organizationUserSchema` —a diferencia
  del resto del contrato, que es requerido-nullable— para que un API sin
  desplegar degrade la columna en vez de tumbar la página.

### 1.3 🟡 Bootstrap del primer admin de una hija por el partner

- **Hoy**: `POST .../admins` es solo backoffice. La ARL crea la empresa hija y
  le asigna licencias, pero el primer administrador lo debe activar Klarimba.
- **Impacto**: el flujo "Crear empresa cliente" del mockup incluía "Invitar al
  Company Admin"; en fase 1 ese campo se omitió y la vista lo comunica con una
  nota ([companies/page.tsx](../src/app/(dashboard)/org/%5BorgId%5D/companies/page.tsx)).
- **Cambio propuesto** (decisión abierta №2 del mapa): permitir
  `POST /organizations/:childId/admins` con scope `parent` y permiso
  `MANAGE_CHILDREN` (encaja en la matriz: es estructura, no gestión de
  personas existentes).
- **Al implementarse**: añadir el campo "Invitar al Company Admin" al diálogo
  [create-company-dialog.tsx](../src/app/(dashboard)/org/%5BorgId%5D/companies/create-company-dialog.tsx)
  y una acción en `actions.ts`.

### 1.4 🟡 Paginación real en los listados

- **Hoy**: los listados aceptan `?limit&offset` (default 20, máx 100) pero el
  envelope no devuelve `pagination` poblado (total de registros).
- **Impacto**: el frontend trae `limit=100` y filtra/cuenta en memoria
  ([users/page.tsx](../src/app/(dashboard)/org/%5BorgId%5D/users/page.tsx),
  [admin/page.tsx](../src/app/(dashboard)/admin/page.tsx)). Con >100 usuarios u
  organizaciones, la vista queda truncada **silenciosamente**.
- **Cambio propuesto**: poblar `pagination: { total, limit, offset }` en los
  listados B2B (`GET .../users`, `GET .../invitations`, `GET .../members`,
  `GET /backoffice/organizations`, `GET .../audit-log`, `GET .../seat-grants`).
- **Al implementarse**: añadir paginación de servidor a las tablas (el cliente
  `apiFetch` ya parsea el envelope; hay que exponer `pagination` en su retorno).

### 1.5 🟡 Contrato del refresh token y logout (header vs cookie)

- **Hoy**: `RefreshTokenGuard` extrae el refresh token de una fuente no
  documentada. El frontend envía **ambas**: `Authorization: Bearer` y cookies
  `refreshAccessToken`/`refreshToken` ([src/lib/api/auth.ts](../src/lib/api/auth.ts),
  [src/proxy.ts](../src/proxy.ts)).
- **Cambio propuesto**: documentar (o unificar a `Authorization: Bearer`) cómo
  esperan el token `POST /auth/refresh-token` y `POST /auth/logout`.
- **Al aclararse**: simplificar los headers en `auth.ts` y `proxy.ts`.
- **Pendiente de prueba**: el flujo de refresh completo no se ha podido
  ejercitar end-to-end (requiere el API corriendo y un token cerca de expirar).

### 1.6 🟡 Evitar el N+1 al resolver el modo del switcher

- **Hoy**: para decidir `company` vs `peoplebasic` el frontend llama a
  `GET /organizations/:orgId/entitlements` **por cada organización** del
  usuario ([dashboard-context.ts](../src/lib/dashboard-context.ts)), en cada
  render del layout.
- **Cambio propuesto** (una de dos):
  - incluir los entitlements activos (o un flag `hasEnterprise`) en la
    `organization` embebida de `GET /me/organizations`, o
  - un endpoint agregado `GET /me/consoles` que devuelva membresía + tipo +
    entitlements de una vez.
- **Al implementarse**: eliminar `resolveOrgContext()` del frontend.

### 1.7 🟢 Campo NIT / identificación fiscal en `Organization`

Decisión abierta №3 del mapa: columna nullable + migración + exponer en
serializer/DTOs. El mockup lo dibuja en el alta de empresas (ARL y SA); hoy el
frontend lo omite. Al añadirse: campo opcional en
`create-company-dialog.tsx` y `create-client-dialog.tsx`.

### 1.8 🟢 Contacto administrativo de la empresa hija

Decisión abierta №1 del mapa: la columna "Company Admin" del portfolio se
eliminó porque el split de privacidad impide que la ARL liste miembros de la
hija. Si producto la quiere, definir en el API un campo acotado (p. ej.
`adminContact` en el summary de la hija) que no exponga el listado de
miembros.

### 1.9 🟢 Normalizar fechas del API

Las fechas llegan a veces como ISO string y a veces como unix timestamp. El
frontend lo tolera (`z.union([z.string(), z.number()])` +
[format.ts](../src/lib/format.ts)), pero unificar a ISO 8601 simplificaría
todos los clientes.

### 1.10 🟢 Auditoría global de plataforma

Hoy el audit-log existe **por organización**. El mockup de Super Admin dibuja
una vista de auditoría global; en fase 1 se muestra dentro del detalle de cada
cliente. Si se quiere la vista global: endpoint
`GET /backoffice/audit-log` con filtros (actor, tipo de evento, rango).

### 1.11 🟢 Backend diferido que desbloquea el resto del mockup (fase 2+)

Sin esto, las vistas seguirán ocultas (ver [frontend-phase1-map.md](./frontend-phase1-map.md)):

| Bloque | Vistas del mockup que desbloquea |
|---|---|
| Equipos y sedes (entidades + membresías por equipo) | Equipos y sedes, columnas Equipo/Sede en Usuarios, "Cambiar de equipo", selects del modal de invitación, perfil Manager |
| Métricas de engagement (WAU/MAU, retención, "último acceso") | Engagement, KPIs del Overview, estado "Inactivo" |
| Bienestar agregado (avance por macrohabilidad + umbral de privacidad) | Bienestar, heatmaps, comparativas |
| Programas y créditos | Programas, modal "Crear programa", onboarding paso 3 |
| Intelligence (copiloto con scope) | Intelligence, AI cards, chat |
| Reportes / Compliance Evidence | Reportes, "Generar reporte", exportaciones |
| Billing B2B (planes, precios, renovaciones) | Facturación, Contratos (SA), Billing (SA), checkout del upsell Enterprise |
| Importación CSV de empleados | Pestaña CSV del modal de invitación, paso 1 del onboarding |

---

## 2. Pendientes del frontend (`klarimba-dashboard`)

### 2.1 🔴 Para cerrar fase 1

| # | Pendiente | Detalle |
|---|---|---|
| 1 | **Probar el flujo completo contra el API real** | El API no estaba corriendo durante el desarrollo. Verificado: build, typecheck, redirects del middleware y render del login. Falta ejercitar: login/logout, refresh del token, cada vista con datos reales, errores de dominio (p. ej. "Insufficient Seats") y el canje visual de estados. |
| 2 | **Commit inicial** | El repo git está inicializado (create-next-app) pero todos los cambios están sin commitear. |
| 3 | **`error.tsx` y `not-found.tsx` personalizados** | Hoy un fallo del API fuera de los casos manejados cae en el error overlay por defecto de Next. Añadir error boundaries por segmento con mensaje amable y botón de reintento; `global-error.tsx` para fallos del layout. |
| 4 | **`loading.tsx` / Suspense por ruta** | No hay skeletons; la navegación entre vistas bloquea hasta resolver los fetches. Usar los `Skeleton` de shadcn ya instalados. |
| 5 | **Manejo de 401 en server actions** | Si la sesión muere a mitad de una acción (token blacklisteado), la acción devuelve el error crudo. Detectar `ApiError.isUnauthorized` en las actions y redirigir a `/login?expired=1`. |
| 6 | **Tamaño de la cookie de sesión** | La cookie sellada guarda access + refresh token. Si los JWT del API crecen (claims extra), puede acercarse al límite de 4 KB por cookie. Verificar con tokens reales; si aplica, dividir en dos cookies o guardar solo identificadores. |

### 2.2 🟡 Robustez y calidad

| # | Pendiente | Detalle |
|---|---|---|
| 7 | **Tests** | No hay ninguno. Mínimo recomendado: unit para `permissions.ts`, `dashboard-context` (resolución de modos), `http.ts` (envelope + errores 422/dominio) y `format.ts`; E2E con Playwright para login → invitar → revocar contra un API seed. |
| 8 | **Paginación de tablas** | Depende del punto 1.4 de backend. Mientras tanto, mostrar aviso si un listado devuelve exactamente 100 filas (posible truncamiento). |
| 9 | **Búsqueda en Usuarios y Clientes** | El mockup no la dibuja pero con >20 filas es necesaria. Client-side sobre lo cargado como primer paso; server-side cuando el API lo soporte. |
| 10 | **Estados optimistas** | Las acciones (revocar, reactivar, asignar) esperan el roundtrip completo. Valorar `useOptimistic` en la tabla de usuarios. |
| 11 | **Toggle de dark mode** | El tema oscuro está definido en `globals.css` y `next-themes` instalado (dependencia de shadcn), pero no hay `ThemeProvider` ni toggle. Decidir si se expone o se elimina la variante `.dark`. |
| 12 | **i18n** | Todos los textos están hardcodeados en español. Si Klarimba opera en Italia (el mockup mezcla it/es), introducir `next-intl` antes de que crezca el copy. |
| 13 | **Accesibilidad** | Revisión de foco en diálogos/dropdowns (Radix cubre lo básico), `aria-live` para toasts de resultado, contraste de los pills en dark mode. |
| 14 | **CI** | Pipeline mínimo: `pnpm lint && pnpm exec tsc --noEmit && pnpm build` (+ tests cuando existan). |
| 15 | **Warnings de lint** | 4 warnings del React Compiler por `form.watch()` de react-hook-form (esperados; el Compiler omite memoizar esos componentes). Si molestan, migrar esos casos a `useWatch`/`Controller`. |

### 2.3 🟢 Funcionalidad existente en el API aún sin UI

| # | Pendiente | Endpoint disponible |
|---|---|---|
| 16 | **Códigos de invitación batch** | `POST .../invitations/batch` (1–100 códigos personales). Es la alternativa real a la carga CSV del mockup. UI sugerida: pestaña "Generar códigos" en el diálogo de invitación + listado con copiar/descargar CSV de códigos. |
| 17 | **Invitaciones SHARED_CODE** | `POST .../invitations` con `type: SHARED_CODE` + `maxRedemptions`. Útil para onboarding masivo sin correos. |
| 18 | **Listado/gestión de invitaciones** | `GET .../invitations` (todas, no solo las PERSONAL visibles en Usuarios): ver expiración, canjes restantes, revocar códigos compartidos. |
| 19 | **Grants del lado backoffice: editar** | `PATCH /backoffice/.../seat-grants/:grantId` (ampliar accesos, suspender, cambiar vigencia). Hoy la UI solo crea y revoca. |
| 20 | **Preview pública de invitación** | `GET /invitations/:code/preview` — página pública `/invite/[code]` para que el invitado vea la organización antes de registrarse (el registro vive en la app People, definir el handoff). |
| 21 | **Filtros de estado en Clientes (SA)** | El API acepta `?status=`; la UI solo filtra por tipo. |

### 2.4 🟢 Diferido de producto (requiere backend de §1.11)

- Onboarding de primer ingreso (modal de 3 pasos del mockup) — adaptable
  cuando existan equipos y programas; el paso "invitar" ya sería posible hoy.
- Contexto "empresa del portfolio" (`co`) como contexto navegable del switcher
  — en fase 1 quedó casi vacío y se decidió no mostrarlo; las hijas se ven
  inline en las vistas del partner.
- Todo el eje de métricas, programas, Intelligence, reportes y facturación.

---

## 3. Orden sugerido de ataque

1. ~~**Backend 1.1 + 1.2**~~ ✅ hechos en el API y frontend ya limpio (sin
   sondeo de `isSuperAdmin()`, sin fallback 404 del rename).
2. **Frontend 2.1** (prueba E2E contra el API real, error/loading boundaries,
   401 en actions, commit) — cierra fase 1 de verdad.
3. **Backend 1.4 + frontend 8/9** (paginación y búsqueda) — antes de que un
   cliente pase de 100 usuarios.
4. **Backend 1.3 + frontend 16–18** (bootstrap por partner y códigos batch) —
   completa los flujos operativos de ARL y de invitación masiva.
5. Resto de 🟢 según prioridad de producto.
