# Gestión Scout 108 — Frontend

Aplicación web de gestión para el **Grupo Scout 108**: administración de beneficiarios (chicos/as), familias, tesorería (caja y cuotas), usuarios del staff y calendario de eventos, con acceso por roles.

## ¿Qué hace la app?

Es un panel de administración (SPA) pensado para los dirigentes y el equipo de gestión del grupo scout. Sus módulos principales son:

- **Inicio**: dashboard con indicadores generales (total de beneficiarios, familias, saldo de caja) y una vista acotada a la rama del dirigente logueado.
- **Beneficiarios**: alta, edición y listado de los miembros del grupo, historial, cuenta corriente y legajo (ficha con documentos).
- **Familias**: alta, edición y listado de familias, con su cuenta familiar y buscador de familias.
- **Calendario**: gestión de eventos y actividades usando FullCalendar (vista mensual/semanal).
- **Tesorería**:
  - *Caja*: registro de movimientos de ingresos y egresos.
  - *Conceptos*: gestión de cuotas/conceptos de cobro, generación masiva de cuotas, pagos (efectivo/transferencia, incluyendo pagos parciales) y archivo/restauración de conceptos.
- **Usuarios**: administración de usuarios del staff y sus roles (`ADMIN`, `JEFE_GRUPO`, `ADMINISTRACION`, `MANADA`, `UNIDAD`, `CAMINANTES`, `ROVERS`).
- **Autenticación**: login, cambio de contraseña obligatorio, sesión guardada en `sessionStorage`, guards de ruta por sesión y por rol.

Las secciones de Familias, Usuarios y Tesorería están restringidas a roles de gestión (`ADMIN`, `JEFE_GRUPO`, `ADMINISTRACION`).

## Stack tecnológico

- [Angular 21](https://angular.dev/) (standalone components, nuevo builder `@angular/build`)
- TypeScript 5.9 (modo `strict`)
- [Tailwind CSS 4](https://tailwindcss.com/) + [daisyUI 5](https://daisyui.com/)
- [FullCalendar](https://fullcalendar.io/) (`@fullcalendar/angular`, `daygrid`, `timegrid`, `interaction`)
- RxJS
- Exportación de reportes: `exceljs` (Excel), `jspdf` + `jspdf-autotable` (PDF), `file-saver`
- Tests unitarios con [Vitest](https://vitest.dev/) + jsdom

El frontend consume una API REST propia (backend separado, no incluido en este repositorio).

## Requisitos previos

- [Node.js](https://nodejs.org/) (versión LTS reciente, ≥ 20)
- npm (el proyecto está fijado a `npm 11.9.0` vía `packageManager`)
- Angular CLI (opcional, se puede usar vía `npx ng` o los scripts de `npm`)
- Un backend corriendo localmente que exponga la API esperada por la app (por defecto en desarrollo: `http://localhost:3000/api`)

## Instalación

```bash
git clone <url-del-repositorio>
cd gestion-scout-front
npm install
```

## Correr la app localmente

Por defecto, en modo desarrollo la app apunta a `http://localhost:3000/api` (ver `src/environments/environment.development.ts`), por lo que se necesita el backend corriendo en ese puerto.

```bash
npm start
```

Esto levanta el servidor de desarrollo en `http://localhost:4200/`. La app se recarga automáticamente al modificar el código fuente.

Si el backend corre en otra URL, ajustá `apiUrl` en `src/environments/environment.development.ts`.

## Build de producción

```bash
npm run build
```

Los artefactos se generan en `dist/`, usando la configuración de `src/environments/environment.ts` (API de producción).

## Tests

```bash
npm test
```

Corre los tests unitarios con Vitest.

## Estructura del proyecto

```
src/app/
├── core/               # guards, interceptors, servicios y utilidades transversales
├── features/           # módulos de negocio: auth, home, beneficiarios, familias, calendario, tesoreria, usuarios
├── models/             # modelos/tipos de datos
└── shared/              # componentes y layout compartidos (navbar, sidebar, modales, etc.)
```

## Capturas de pantalla

<!-- TODO: agregar capturas de pantalla de las pantallas principales (Inicio, Beneficiarios, Familias, Tesorería, Calendario) -->

## Licencia

MIT — ver [LICENSE](LICENSE).
