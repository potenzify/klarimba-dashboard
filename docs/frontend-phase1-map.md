# Frontend Fase 1 — Mapa mockup → API

> Checklist para el traspaso de `onboarding_mockup.html` a frontend real: qué vistas tienen respaldo en el API hoy y qué debe **ocultarse** en la fase 1. Contraparte de [b2b-feature.md](./b2b-feature.md) (estado del API) y [b2b-enterprise-plan.md §1.2](./b2b-enterprise-plan.md) (qué está diferido y por qué).

Leyenda: ✅ conectable ya · ⚠️ parcial (recortar) · ❌ ocultar en fase 1.

## Regla del context switcher

El modo del dashboard se resuelve con datos reales, calcando `currentMode()` del mockup:

| Señal | Endpoint |
|---|---|
| Rol del usuario en cada organización | `GET /v1/me/organizations` (`role`: `COMPANY_OWNER` / `HR_ADMIN` / `MEMBER`) |
| ¿SUPER_ADMIN de plataforma? | `platformRole` del perfil (JWT/me) |
| ¿Modo People básico o Enterprise? | `GET /v1/organizations/:orgId/entitlements` (¿add-on `ENTERPRISE` activo?) |
| ¿Contexto portfolio? | La org del usuario tiene `type: PARTNER` (o `TENANT` con hijas) |

**Perfil `Manager`: ocultar el modo completo en fase 1** (rol diferido — sin sedes/equipos no tiene scope).

## Empresa Enterprise (`company`)

| Vista | Estado | Fase 1 |
|---|---|---|
| Overview | ⚠️ | Mostrar solo el bloque de accesos (`GET /organizations/:orgId` → `seatUsage`). Ocultar KPIs de engagement/bienestar y AI card. |
| Usuarios | ✅ | `GET .../users?status=` (INVITED/ACTIVE/SUSPENDED/REVOKED). Invitar por email (`POST .../invitations` PERSONAL+EMAIL, envía correo), reenviar (`POST .../invitations/:id/resend`), revocar (`DELETE .../members/:id`), reactivar (`PATCH .../members/:id`). **Ocultar**: columnas Equipo/Sede, "Último acceso", estado "Inactivo", acción "Cambiar de equipo". |
| Equipos y sedes | ❌ | Sin backend. |
| Engagement | ❌ | Métricas diferidas. |
| Bienestar agregado | ❌ | Métricas + fórmula de avance diferidas. |
| Programas | ❌ | Programas/créditos diferidos. |
| Intelligence | ❌ | Diferido. |
| Reportes | ❌ | Depende de métricas/Compliance Evidence. |
| Facturación | ❌ | Sin billing B2B. (Versión mínima opcional: "plan contratado/accesos" desde el summary.) |
| Configuración | ⚠️ | Editar nombre (`PATCH`, permiso `MANAGE_ORGANIZATION`, solo Owner). Ocultar integraciones SSO/HRIS/CSV. |

## Consola People básico (`peoplebasic`)

| Vista | Estado | Fase 1 |
|---|---|---|
| Overview | ✅ | Accesos y activación desde el summary. |
| Usuarios | ✅ | Igual que arriba, mismos recortes. |
| Equipos básicos | ❌ | |
| Facturación | ❌ | |
| Añadir Enterprise (upsell) | ⚠️ | El estado sale de `GET .../entitlements`; no hay checkout → CTA "contactar ventas" (la activación es manual vía backoffice). |

## Partner ARL (`portfolio`)

| Vista | Estado | Fase 1 |
|---|---|---|
| Overview portfolio | ⚠️ | Lista de empresas + licencias (`GET .../children` + summary por hija). Ocultar engagement/bienestar del portfolio. |
| Empresas | ✅ | Crear empresa cliente (`POST .../children`), licencias X/Y por hija. **Ocultar/resolver**: columna "Company Admin" (split de privacidad: la ARL no ve miembros de la hija), columna NIT (no existe el campo), estado "Invitación pendiente" (bootstrap de admin es solo backoffice hoy). |
| Licencias y accesos | ✅ | `POST .../seat-grants` sobre la hija (descuenta del padre, permiso `ALLOCATE_SEATS`). |
| Engagement del portfolio | ❌ | |
| Bienestar agregado | ❌ | |
| Intelligence / Reportes | ❌ | |
| Configuración | ⚠️ | Igual que empresa. |

## Empresa del portfolio (`co` — lectura de la ARL)

Solo Overview reducido a cupos/summary (⚠️). Engagement, Bienestar y Reportes ❌. En fase 1 el contexto queda casi vacío — evaluar si mostrarlo.

## Super Admin (`superadmin`)

| Vista | Estado | Fase 1 |
|---|---|---|
| Overview plataforma | ⚠️ | Conteos con `GET /backoffice/organizations`; sin métricas de plataforma. |
| Clientes | ✅ | CRUD de orgs, grants, bootstrap de admin (`role` opcional Owner/HR). |
| Partners | ✅ | Crear con `type: PARTNER`. |
| Contratos | ❌ | No hay entidad contrato (los grants viven en Clientes). |
| Producto & Entitlements | ✅ | `POST/DELETE /backoffice/organizations/:orgId/entitlements`. |
| Billing | ❌ | |
| Auditoría | ⚠️ | Existe **por organización** (`GET .../audit-log`), no global → mostrarla dentro del detalle de cada cliente. |

## Modales y flujos

| Elemento | Estado | Nota |
|---|---|---|
| Invitar empleados — por email | ✅ | Sin selects de equipo/sede. |
| Invitar empleados — pestaña CSV | ❌ | No hay endpoint de importación. Alternativa existente que el mockup no dibuja: batch de códigos personales (`POST .../invitations/batch`, 1–100). |
| Crear equipo | ❌ | |
| Crear empresa cliente (ARL/SA) | ✅ | |
| Onboarding de primer ingreso | ⚠️ | Adaptar los pasos que tocan equipos/CSV. |

## Decisiones abiertas antes del traspaso

1. **Columna "Company Admin" en el portfolio**: eliminarla, o definir en el API un campo acotado "contacto administrativo" de la hija que no exponga el listado de miembros (hoy el split de privacidad lo bloquea).
2. **Bootstrap del primer admin por la ARL**: hoy `POST .../admins` es solo backoffice. Decidir si el permiso `MANAGE_CHILDREN` del padre debe incluirlo (encaja en la matriz: es estructura, no gestión de personas existentes).
3. **Campo NIT / identificación fiscal** en `Organization`: no existe; añadido menor si se necesita (columna nullable + migración).

## Resumen

- **Conectable ya (~40% de las vistas)**: Usuarios completo, eje ARL de estructura (empresas/licencias), backoffice SA (clientes/partners/entitlements/auditoría por org) y la resolución del modo del switcher.
- **Ocultar en fase 1**: eje de métricas completo (engagement/bienestar/intelligence/reportes), programas, facturación/billing/contratos, equipos/sedes y el perfil Manager.
