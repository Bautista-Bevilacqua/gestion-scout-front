# Frontend — Gestión Scout 108

SPA en Angular para el sistema de gestión del Grupo Scout 108. Ver también [../CLAUDE.md](../CLAUDE.md) para el contexto general del sistema (Frontend + Backend) y [README.md](README.md) para la documentación funcional orientada a humanos (módulos, capturas, instalación) — este archivo se enfoca en lo operativo/arquitectónico.

## Stack

- **Angular 21** con **standalone components** (sin `NgModule`) y el builder `@angular/build` (esbuild).
- **TypeScript 5.9**, `strict: true` + flags extra (`noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`).
- Estado: **RxJS** para llamadas HTTP + **Angular Signals** para estado local reactivo por servicio. No hay NgRx/Redux/store centralizado.
- UI: **Tailwind CSS 4** + **daisyUI 5** (no Angular Material, no Bootstrap).
- Librerías de dominio: `@fullcalendar/angular` (calendario), `exceljs` + `jspdf`/`jspdf-autotable` + `file-saver` (exportes Excel/PDF, client-side).
- Testing: **Vitest 4** + jsdom vía `@angular/build:unit-test` (no Karma/Jasmine).
- Node.js LTS ≥ 20, npm fijado a `11.9.0` (`packageManager` en package.json).

## Arrancar en desarrollo

```
npm start   # ng serve, http://localhost:4200 — requiere node-api corriendo en :3000
npm run build
npm run watch
npm test    # Vitest
```

No hay script `lint` ni ESLint configurado.

No hay `.env`: la config de entorno vive en `src/environments/`:
- `environment.development.ts` → `apiUrl: 'http://localhost:3000/api'`
- `environment.ts` (producción) → `apiUrl: 'https://api.gruposcout108.com.ar/api'`

`angular.json` hace el file replacement de dev↔prod automáticamente según la configuración de build/serve.

## Estructura (`src/app/`)

Organización **feature-based** (no por tipo de archivo):

```
app/
  app.ts / app.routes.ts / app.config.ts   # raíz: bootstrap, rutas raíz, providers (router, HttpClient+interceptors)
  core/
    guards/        # auth.guard.ts, role.guard.ts
    interceptors/   # auth.interceptor.ts, error.interceptor.ts
    services/       # un servicio HTTP por entidad + auth/theme
    utils/          # custom-validators.ts
  features/
    auth/pages/          # login, cambiar-password
    home/pages/           # dashboard
    beneficiarios/        # components/ + pages/ + beneficiarios.routes.ts
    familias/              # components/ + pages/ + familias.routes.ts
    calendario/pages/
    tesoreria/             # subcarpetas caja/ y conceptos/, cada una con su .routes.ts
    usuarios/              # components/ + pages/ + usuarios.routes.ts
  models/          # interfaces TS: beneficiario, caja, cargo, concepto-cobro, evento, familia, legajo, usuario
  shared/
    components/    # navbar, sidebar, modales (confirm, confirmar-pago), alerts, spinner, buscador-familia, selector-rama
    layout/main-layout/
```

Rutas de features se cargan **lazy** (`loadComponent`/`loadChildren`) desde `app.routes.ts`.

**Anomalías de nombres a tener en cuenta al buscar/crear archivos** (para no perder tiempo buscando en el lugar equivocado):
- Algunas carpetas de componente terminan en `.component/` (`beneficiario-form.component/`, `calendario-page.component/`, `loading-spinner.component/`) o incluso `.ts/` (`usuarios-list-page.ts/`) en vez de solo `nombre-feature/`. No es consistente — revisar la carpeta real antes de asumir el patrón.
- El modal de confirmación de pago: el `.ts` es `confirmar-pago.modal.component.ts` pero su HTML/CSS son `confirmar-pago-modal.component.*` (orden de las palabras invertido).

## Routing y autorización

- `provideRouter(routes)` en `app.config.ts`, rutas raíz en `app.routes.ts`.
- Rutas principales: `/login`, `/change-password` (públicas); bajo `MainLayoutComponent` + `authGuard`: `''` (dashboard), `/calendario`, `/beneficiarios` (+ `rama/:rama`, `nuevo`, `editar/:id`, `:id/cuenta`, `:id/legajo`, `:id/historial`), `/familias` (roleGuard gestión), `/usuarios` (roleGuard, `nuevo`/`editar/:id` solo ADMIN), `/tesoreria` (roleGuard: `conceptos` solo ADMIN/JEFE_GRUPO, `caja` para el resto que pasa el guard raíz).
- `authGuard`: chequea el signal `authService.usuarioActual()`, redirige a `/login` si no hay sesión.
- `roleGuard`: ADMIN/JEFE_GRUPO tienen pase libre; luego chequea `route.data['roles']`; luego matchea `:rama` param contra la rama del dirigente; ADMINISTRACION tiene pase libre de *consulta* en rutas por rama. Si rebota, redirige según rol (ADMINISTRACION → `/tesoreria/caja`, dirigentes de rama → `/beneficiarios/rama/:suRama`).
- Roles (`RolUsuario` en `auth.service.ts`): `ADMIN`, `MANADA`, `UNIDAD`, `CAMINANTES`, `ROVERS`, `JEFE_GRUPO`, `ADMINISTRACION`. Esta lógica replica en el frontend (por UX) la que ya aplica el backend — el backend es la fuente de verdad real, no confiar solo en el guard para seguridad.

## Comunicación con el backend

- `HttpClient` con `provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor]))`.
- Un servicio `@Injectable({providedIn:'root'})` por entidad en `core/services/`: `auth`, `beneficiario`, `familia`, `caja`, `concepto`, `cargo`, `evento`, `legajo`, `usuario`. Todos devuelven `Observable<T>` y usan `${environment.apiUrl}/<recurso>`.
- `beneficiario.service.ts` (y otros) mantienen una **cache local en signal** que se invalida manualmente tras mutaciones (`tap()` + `limpiarCache()`) — al agregar un método de mutación nuevo, recordar invalidar la cache correspondiente.
- `cargo.service.ts` tiene `crearCargoPersonalizado(idBeneficiario, monto, descripcion?)` → `POST /cargos/personalizado`, usado desde el botón "Agregar deuda" de `cuenta-corriente-page` para cargar una deuda suelta sin concepto (ver `node-api/CLAUDE.md` para el detalle del lado backend).
- `export.service.ts` no llama a la API: genera Excel/PDF client-side con `exceljs`/`jspdf`.
- Interceptors: `auth.interceptor.ts` agrega `Authorization: Bearer <token>` solo a requests hacia `environment.apiUrl`, y ambos `auth.interceptor.ts` y `error.interceptor.ts` manejan 401 → `logout()` (lógica duplicada entre los dos — tenerlo en cuenta si se toca el manejo de 401).

## Autenticación

- `AuthService.login()` → `POST {apiUrl}/auth/login`, guarda `{...usuario, token}` en el signal `usuarioActual` y en `sessionStorage` (clave `scout_session`, **no** `localStorage` — se migró explícitamente por seguridad).
- Sesión se restaura al bootear la app (`cargarSesionGuardada()` en el constructor de `AuthService`).
- Cambio de password obligatorio: flag `debe_cambiar_password` en el usuario logueado → ruta `/change-password`.
- `ThemeService` usa `localStorage` (clave `theme`) para preferencia de tema — no confundir con la sesión.

## UI

- Tailwind 4 + daisyUI 5 vía PostCSS (`@import 'tailwindcss'; @plugin "daisyui";` en `src/styles.css`).
- Theming claro/oscuro: `ThemeService` setea `data-theme` en `document.documentElement` (contrato daisyUI).
- Templates HTML separados por componente (no inline, no CSS-in-JS).

## Convenciones de código

- **Prettier** (`.prettierrc`): `printWidth: 100`, `singleQuote: true`, parser `angular` para `.html`. Sin script `format` — correr vía `npx prettier`.
- Sin ESLint.
- `.editorconfig`: UTF-8, indent 2 espacios, comillas simples en `.ts`.
- Comentarios informales/humorísticos en español en zonas de lógica de autorización (guards, rutas) — mantener el tono si se genera código similar.
- Dominio en español (beneficiario, familia, caja, concepto, legajo, cuota), infraestructura Angular en inglés (guard, interceptor, service).

## Testing

Cobertura mínima: solo existe `src/app/app.spec.ts` (smoke test boilerplate del componente raíz). Ningún feature, servicio, guard o interceptor tiene tests — no asumir cobertura al modificar código existente.

## Features agregadas

- **Deuda personalizada del beneficiario** (`cuenta-corriente-page.component.*`): botón "➕ Agregar deuda" junto al selector de conceptos, en la card "Anotar Deuda Nueva". Abre el modal `#modal_agregar_deuda` (mismo patrón que `#modal_cargar_saldo`: `<dialog>` + `FormGroup` reactivo) con `monto` (obligatorio) y `descripcion` (opcional, texto libre). Llama a `CargoService.crearCargoPersonalizado()`. Pensado para deudas puntuales de un solo beneficiario que antes se llevaban en un Excel aparte (no tiene sentido crear un `ConceptoCobro` por cada monto distinto).
- **Familias monoparentales + contacto principal** (`familia-form.component.*`): se sacó el validador `formatoFamilia` que forzaba `Apellido-Apellido` en `apellido_familia` (ahora es texto libre). Se agregaron toggles `tiene_padre`/`tiene_madre` (daisyUI `toggle`, controles boolean en el mismo `FormGroup`) que muestran/ocultan la sección de cada progenitor y activan/desactivan sus `Validators` dinámicamente vía `actualizarValidadoresProgenitor()` (usa `enable()`/`disable()` de reactive forms, no `*ngIf` sobre el control). No se puede desactivar el último progenitor activo (el `valueChanges` del toggle lo revierte). Si ambos están activos aparece un radio `contacto_principal` (PADRE/MADRE) — si sólo uno está activo, se asigna solo sin mostrar el radio. El campo único `email` del form viejo se reemplazó por `email_padre`/`email_madre`. `familias-table` muestra un badge "Principal" junto al progenitor marcado como contacto y usa `emailContacto(f)` (según `contacto_principal`) en la columna Email.
- **Nota de UI**: los toggles/checkboxes de daisyUI a veces tienen un hit-area más chico que el `<label>` visual — si un test o automatización clickea y no surte efecto, usar `form_input` (o disparar el evento directo) en vez de asumir que el click en coordenadas del label alcanza el input real.
