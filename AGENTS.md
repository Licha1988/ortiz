<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/`
before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Casa Ortiz — Guía para agentes

App de gestión operativa gastronómica. Next.js 16 (App Router) + React 19 + Tailwind v4,
100% client-side. Una sola ruta (`app/page.tsx`) monta `components/CasaOrtizApp.tsx`.

## Entorno

- SO del dev: **Windows + PowerShell**. Encadená comandos con `;`, NO con `&&`.
- Node con npm. No usar yarn/pnpm/bun (el lockfile es de npm).

## Comandos

- `npm run dev` → servidor local (localhost:3000)
- `npm run build` → build de producción (validación obligatoria antes de commit)
- `npm run lint` → ESLint
- `npm run export` → genera `casa-ortiz-interactive.html` (Vite single-file, `file://`)

## Arquitectura

- `lib/` = lógica pura: cálculo, tipos, defaults. **Sin JSX, sin `"use client"`.**
- `components/` = UI. Componentes con estado: `"use client"`.
- `components/ui/` = primitivas reutilizables (KpiCard, SectionCard, inputs, tablas).
- Estado global: `useState` en `CasaOrtizApp`, drilleado por props.
- Cálculo derivado: `useMemo` sobre funciones puras de `lib/`. Nunca derivar en `useEffect`.
- Alias de imports: `@/*` → raíz del repo.

## Dominios de cálculo

| Módulo | Responsabilidad |
|--------|-----------------|
| `lib/calculations.ts` | Cubiertos y facturación (Gestión operativa) |
| `lib/staffing/*` | Dotación de personal (Recurso humano) |
| `lib/payroll/*` | Nómina y comparación contratado vs sugerido |
| `lib/cashflow.ts` | EERR mensual. **Independiente** del driver operativo |

## Convenciones de UI

Ver `DESIGN_SYSTEM.md` (incluye **Design consistency rules**). Resumen:

- Reutilizar `components/ui/` antes de crear componentes nuevos.
- No inventar colores, tipografía, radius, sombras ni spacing fuera del design system.
- Toda pestaña: `AppHeader` → `PageLayout` → contenido.
- Acción primaria: arriba a la derecha (toolbar del header).
- Destructivo: confirmación obligatoria (sin `window.confirm`).
- Empty state: título + descripción + una acción.
- Tablas: `table-styles.ts`, misma altura de fila; filtros y menú de acciones unificados cuando aplique.
- Formularios: label → helper → input → error → submit (derecha).
- Input editable → `bg-amber-50` (focus `bg-amber-100` + ring violeta)
- Cifras → `tabular-nums`; moneda vía `lib/format.ts`

## Reglas de negocio sensibles

- **Costo de gestión operativa** = Lisandro + Bruno (`MANAGEMENT_ROLE_IDS`), separado del equipo.
- **Francos**: nunca viernes/sábado; repartir domingo–miércoles (`DAY_OFF_POOL` en `lib/staffing/schedules.ts`).
- **Staffing**: dimensionar por el pico del día/franja más exigente, no por la suma.
- **Claves legacy de cocina AM** (`FUE_AM`, `GUAR_AM`, etc.): no asumir semántica por el nombre de la clave.

## Antes de commitear

1. `npm run build` y `npm run lint` en verde.
2. No commitear `dist-export/` ni `casa-ortiz-interactive.html`.
3. Commits solo cuando el usuario lo pida.
