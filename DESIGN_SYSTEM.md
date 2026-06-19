# Casa Ortiz — Design System

Especificación basada en el **estado actual del repositorio**. Tokens compartidos en `lib/ui/tokens.ts` y `lib/ui/table-styles.ts`. Primitivas en `components/ui/`.

---

## Principios

1. **Celda amarilla = editable.** Todo campo que el usuario puede modificar usa fondo `amber-50`.
2. **Densidad de datos.** Tablas compactas, números con `tabular-nums`, totales destacados.
3. **Color por jerarquía**, no por decoración. El color indica contexto (pestaña, turno, salud) o editabilidad.
4. **Desktop-first.** El layout asume pantalla ancha; mobile usa scroll horizontal en tablas (ver sección Mobile).

---

## Design consistency rules

Reglas **obligatorias** para todo cambio de UI. Si una regla requiere un token o patrón nuevo, actualizar este archivo **antes** de mergear.

### 1. Reutilizar antes de crear

Antes de crear un componente nuevo:

1. Revisar `components/ui/` (primitivas).
2. Revisar componentes de dominio existentes (`WeeklyMatrixTable`, `SectionCard`, etc.).
3. Solo crear archivo nuevo si ninguno cubre el caso, o si el existente se generaliza sin duplicar estilos.

### 2. No inventar tokens visuales

No introducir colores, tamaños de fuente, border-radius, sombras ni espaciados fuera de los definidos en este documento y en `lib/ui/tokens.ts` / `lib/ui/table-styles.ts`.

| Token | Valores permitidos |
|-------|-------------------|
| Radius | `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` |
| Sombra | `shadow-sm` únicamente |
| Espaciado página | `px-6 py-8`, `space-y-6` / `space-y-8`, grids `gap-4` / `gap-8` |
| Tipografía | Escala de la sección Tipografía |

Excepción: alinear `export-html.ts` (deuda pendiente).

### 3. Mismo layout de dashboard en todas las pantallas

Toda pestaña debe seguir:

```
AppHeader  →  PageLayout  →  [ Driver/KPIs ]  →  [ Contenido principal ]  →  [ Parámetros / secundario ]
```

- Contenedor: `PageLayout` (`max-w-6xl` operativa · `max-w-[1400px]` resto).
- No usar `<main>` con clases ad-hoc; no omitir el header compartido.
- **Estado actual:** todas las pestañas usan `PageLayout`.

### 4. Acciones primarias arriba a la derecha

La acción principal de cada pantalla va en la **esquina superior derecha** del header o de la sección driver.

| Pantalla | Acción primaria | Ubicación |
|----------|-----------------|-----------|
| Global | Exportar informe | `AppHeader`, derecha |
| Staffing | Agregar puesto | Footer plantilla (mover a header de sección cuando se unifique) |
| Resto | Edición inline en tablas | No compite con acción primaria del header |

Estilo acción primaria en toolbar: `rounded-full bg-violet-800 text-white` o secundaria con borde si no es la única CTA.

### 5. Acciones destructivas con confirmación

Toda acción irreversible (eliminar persona, resetear escenario, borrar fila) **debe** pedir confirmación explícita antes de ejecutar.

- Usar modal de confirmación (cuando exista `ConfirmDialog`) — no `window.confirm()`.
- Copy: qué se elimina + consecuencia + botones Cancelar / Confirmar.
- Botón confirmar: tono destructivo (`text-red-600`, borde o fondo `rose`).

**Estado actual:** `ConfirmDialog` en `StaffRosterTable` al quitar persona.

### 6. Estados vacíos

Todo estado sin datos debe usar el componente `EmptyState` (a implementar en `components/ui/`) con **tres elementos obligatorios**:

1. **Título** — `text-sm font-semibold text-stone-900`
2. **Descripción** — `text-sm text-stone-500`, una oración
3. **Una acción clara** — botón o link que resuelva el vacío (ej. "Agregar puesto")

Layout: `py-8 px-4 text-center` dentro del contenedor de la tabla/sección.

**Estado actual:** solo mensajes inline (`text-stone-400`) — migrar al patrón completo.

### 7. Tablas unificadas

Toda tabla nueva debe usar `table-styles.ts` y estos invariantes:

| Aspecto | Estándar |
|---------|----------|
| Header | Variante según pestaña; `text-xs font-semibold uppercase tracking-wide`; altura `py-2.5` (`py-2` solo cashflow denso) |
| Fila de datos | `py-2.5` estándar · `py-1.5` plantilla densa |
| Contenedor | Card + `overflow-x-auto` + `min-w-[…]` |
| Filtros | Barra sobre `<table>`: `flex gap-2 px-4 py-3 border-b border-stone-100` (cuando aplique) |
| Menú de acciones | Columna final o icono `⋯` por fila; mismo patrón en toda la app (a definir en `RowActions`) |

No crear headers con colores o alturas distintas sin actualizar este doc.

**Estado actual:** filtros y menú de acciones por fila **no existen** — no improvisar por tabla.

### 8. Formularios unificados

Todo formulario (bloque de inputs, no celdas sueltas en tabla) debe seguir:

```
[ Label          text-sm font-medium text-stone-900 ]
[ Helper?        text-xs text-stone-500 mt-0.5       ]
[ Input          editableInput / amber-50              ]
[ Error?         text-xs text-red-600 mt-1           ]
…
[ Submit?        alineado derecha, mt-4              ]
```

- **Label:** obligatorio en inputs standalone.
- **Helper:** opcional, debajo del label.
- **Error:** obligatorio cuando la validación falla (hoy la validación es silenciosa — migrar a error visible).
- **Submit:** botón primario abajo a la derecha si hay acción de guardado explícita.

Inputs en celdas de tabla: exentos de label (contexto de columna), mantienen `amber-50`.

---

## Tipografía

### Familias

| Token CSS | Fuente | Uso |
|-----------|--------|-----|
| `--font-geist-sans` | Geist | Cuerpo, tablas, inputs, UI general |
| `--font-source-serif` | Source Serif 4 (weight 600) | Título principal del header (`font-serif`) |
| `--font-geist-mono` | Geist Mono | Disponible; **no usado** en componentes actuales |

Definidas en `app/layout.tsx`, aplicadas en `app/globals.css`.

### Escala (Tailwind, uso real)

| Rol | Clases | Dónde |
|-----|--------|-------|
| Marca / eyebrow | `text-sm uppercase tracking-[0.2em] font-medium` | Header "Casa Ortiz" |
| Título de página | `font-serif text-3xl sm:text-4xl font-semibold` | `AppHeader` h1 |
| Subtítulo de página | `text-sm text-stone-600` | `AppHeader` descripción |
| Título de sección | `text-sm font-semibold` (header de card) | `SectionCard`, headers slate/violet |
| Título de bloque | `text-lg font-semibold` | Distribución por franja/día |
| KPI valor | `text-2xl font-bold tabular-nums tracking-tight` | `KpiCard`, KPIs payroll |
| KPI valor grande | `text-lg font-semibold` | Driver operativo |
| Header de tabla | `text-xs font-semibold uppercase tracking-wide` | `<th>` en todas las tablas |
| Header de tabla denso | `text-[11px] uppercase tracking-wide` | Cashflow EERR |
| Celda de datos | `text-sm tabular-nums` | Celdas numéricas |
| Celda compacta | `text-xs tabular-nums` | Plantilla, rush, heatmap |
| Micro / leyenda | `text-[10px]` o `text-[11px]` | Badges, footnotes |
| Badge | `text-[10px] font-semibold` | Pills de rol, elasticidad |

### Reglas

- Números financieros y cubiertos: siempre `tabular-nums`.
- Headers de tabla: preferir `uppercase` + `tracking-wide`.
- No mezclar `font-serif` fuera del título principal del header.

---

## Colores

### Base (globals)

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `#f5f5f4` (stone-100) | Fondo de app (`CasaOrtizApp`) |
| `--foreground` | `#1c1917` (stone-900) | Texto principal |

### Neutros (texto y superficies)

| Token Tailwind | Uso |
|----------------|-----|
| `stone-900` | Texto principal, valores KPI |
| `stone-700` / `stone-800` | Texto secundario fuerte |
| `stone-600` | Descripción, labels |
| `stone-500` | Labels de KPI secundarios |
| `stone-400` | Placeholders, leyendas, celdas vacías (`—`) |
| `stone-200` / `stone-100` | Bordes, fondos de barra, divisores |
| `white` | Superficie de cards y tablas |

### Acento por pestaña / contexto

| Contexto | Header sólido | Borde card | Header tabla | Texto acento |
|----------|---------------|------------|--------------|--------------|
| Operativa / Cashflow / Payroll | `violet-800` | `violet-200`–`violet-300` | `violet-100` / `violet-900` | `violet-700` |
| Recurso humano | `slate-800` | `slate-300`–`slate-400` | `slate-700` / blanco | `slate-600` |
| Turno AM | `sky-800` | — | — | `sky-700` |
| Turno PM | `indigo-800` | — | — | `indigo-700` |
| Fijos (plantilla) | `stone-700` | — | — | — |

Importar desde `sectionHeaders` y `shiftHeaders` en `lib/ui/tokens.ts`.

### Editabilidad (obligatorio)

| Estado | Fondo | Borde focus | Ring |
|--------|-------|-------------|------|
| Input editable | `bg-amber-50` | `border-violet-500` o `border-violet-300` | `ring-2 ring-violet-400/30` |
| Focus | `bg-amber-100` | — | — |
| Celda editable en tabla | `bg-amber-50` / `border-amber-300` | — | `focus:bg-amber-100` |

### Semáforo de salud (nómina / costo sobre ventas)

| Rango | Fondo | Texto | Label |
|-------|-------|-------|-------|
| ≤ 30% | `emerald-600` | blanco | Saludable |
| ≤ 40% | `amber-500` | blanco | Atención |
| > 40% | `red-600` | blanco | Crítico |

Funciones: `healthTone()`, `healthClasses` (`lib/ui/tokens.ts`), `payrollHealthColor()` (`lib/payroll/calculations.ts`).

### Semántica de resultado

| Significado | Color típico |
|-------------|--------------|
| OK / activo | `emerald-100` / `emerald-700`–`800` |
| Atención / faltante | `amber-100` / `amber-700` |
| Excedente | `sky-100` / `sky-700` |
| Costo / negativo | `rose-600` |
| Franco (horario) | `rose-100` / `rose-800` |
| Inactivo / apagado | `opacity-50`, `text-stone-400` |

### Mapa de calor (exigencia operativa)

`slate-50` → `emerald-100` → `amber-300` → `orange-500` → `red-600` (intensidad creciente).

### Prohibido

- Introducir una 5.ª paleta de acento sin actualizar este doc y `tokens.ts`.
- Usar `bg-amber-50` en celdas **solo lectura**.
- Colores hex sueltos en JSX (excepto `export-html.ts`, pendiente de alinear).

---

## Espaciados

### Layout de página

| Elemento | Clases |
|----------|--------|
| Contenedor principal | `mx-auto px-6 py-8` |
| Ancho operativa | `max-w-6xl` (`PageLayout width="narrow"`) |
| Ancho resto de pestañas | `max-w-[1400px]` (`PageLayout` default) |
| Entre secciones | `space-y-6` (cashflow/payroll) o `space-y-8` (operativa/staffing) |
| Header app | `px-6 py-8` dentro de `max-w-[1400px]` |

### Cards y secciones

| Elemento | Padding |
|----------|---------|
| Header de card | `px-4 py-3` o `px-5 py-3.5` |
| Cuerpo de card | `px-5 py-4` o `px-6 py-5` |
| KPI card | `p-5` |
| Footer de tabla | `px-4 py-3` o `px-5 py-2.5` |

### Tablas

| Elemento | Padding |
|----------|---------|
| Header `<th>` | `px-3 py-2.5` (estándar) · `px-2 py-2.5` (cashflow denso) |
| Celda `<td>` | `px-3 py-2.5` · `px-2 py-2.5` (compacto) |
| Plantilla (denso) | `px-2 py-1.5` |

### Grids

| Patrón | Clases |
|--------|--------|
| KPIs | `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` |
| Dos columnas operativa | `grid gap-8 lg:grid-cols-2` |
| Parámetros cashflow | `grid gap-4 md:grid-cols-3` |
| Nav tabs | `flex flex-wrap gap-2` |

---

## Bordes y radios

### Radios (uso real)

| Elemento | Radio |
|----------|-------|
| Cards estándar | `rounded-lg` |
| Cards destacadas (KPI block, payroll) | `rounded-xl` o `rounded-2xl` |
| KPI card | `rounded-2xl` |
| Inputs standalone | `rounded-xl` o `rounded-lg` |
| Inputs en tabla | sin radio (celda rectangular) |
| Botones nav / export | `rounded-full` |
| Badges / pills | `rounded-full` |
| Barras de progreso | `rounded-full` |

### Bordes

| Elemento | Clase |
|----------|-------|
| Card exterior | `border border-stone-200` o acento (`violet-200`, `slate-300`) |
| Tabla celda | `border border-{color}-200/300` vía `table-styles` |
| Header app | `border-b border-stone-200` |
| Divisor interno | `border-t border-stone-100` |
| Sombra card | `shadow-sm` (único nivel en uso; no `shadow-md/lg`) |

---

## Cards

### Tipos en uso

| Tipo | Componente | Estructura |
|------|------------|------------|
| KPI | `components/ui/KpiCard` | Borde + padding, label uppercase, valor 2xl, hint opcional. Tones: `stone`, `emerald`, `amber`, `violet`. |
| Sección con header | `components/ui/SectionCard` | Header sólido (`sectionHeaders`) + cuerpo blanco. Prop `tone`: `operational`, `staffing`, `payroll`, `cashflow`. |
| Sección colapsable | `components/ui/CollapsibleSection` | Header `slate-800` clickable + chevron ▶/▼. |
| Card legacy inline | `<section className="overflow-hidden rounded-lg border …">` | Aún presente en payroll, matrices; migrar a `SectionCard`. |
| Driver operativo | Section violeta + grid de métricas | Staffing / operativa |

### Reglas

- Todo bloque de contenido va dentro de una card con borde visible.
- Header de color solo en la franja superior, no en todo el card.
- Footer opcional con `border-t bg-slate-50` o `bg-stone-50`.

---

## Tablas

### Variantes (`lib/ui/table-styles.ts`)

| Variante | Cuándo |
|----------|--------|
| `operational` | Matrices semanales cubiertos/facturación (`WeeklyMatrixTable`) |
| `violet` | Ticket matrix, tablas editables operativa |
| `slate` | Matriz madurez, plantilla, rotación |

Importar con `tableStyles(variant)` → `{ header, label, data, total, grandTotal }`.

### Patrones estructurales

```
overflow-hidden card
  └─ overflow-x-auto
       └─ table.w-full.min-w-[720–980px].border-collapse
```

Cashflow EERR: `table-fixed` + `colgroup` fijo para ver 12 meses sin scroll (objetivo desktop).

### Convenciones

- Primera columna: labels alineados a la izquierda.
- Números: centrados o a la derecha según tabla; siempre `tabular-nums`.
- **Altura de fila:** header y datos `py-2.5` (ver regla 7 de Design consistency rules).
- Fila total: fondo más oscuro (`grandTotal`, `violet-800`, `slate-700`).
- Sticky label: cashflow usa `sticky left-0` en columna concepto.
- Formato denso: `compactCurrency()` en cashflow; tooltip `title` con valor exacto.
- Sección por turno: fila `colSpan` con header AM/PM (`sky` / `indigo`).

### Filtros (patrón estándar — a implementar)

Barra opcional encima de la tabla, dentro del card:

```tsx
<div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
  {/* inputs de filtro, mismo estilo editableInput compacto */}
</div>
```

Misma posición en todas las tablas que filtren datos.

### Menú de acciones por fila (patrón estándar — a implementar)

- Columna final estrecha o icono `⋯`.
- Acciones destructivas dentro del menú → confirmación (regla 5).
- No mezclar botón "×" suelto sin confirm en tablas nuevas.

### Celdas editables en tabla

Usar `tableInputCell` + `tableInputInner` de `table-styles.ts`, o `border-amber-300 bg-amber-50 p-0` + input transparente.

---

## Formularios

### Layout estándar de campo

Ver regla 8 de Design consistency rules. Orden vertical fijo:

1. Label → 2. Helper (opcional) → 3. Input → 4. Error (si aplica)

### Tipos de input en uso

| Tipo | Contexto | Clases clave |
|------|----------|--------------|
| Number (driver) | Cubiertos, ratios | `bg-amber-50 rounded-xl border-violet-300` + ring violeta |
| Number (porcentaje) | Distribución franja/día | `bg-white` o `bg-stone-50`, borde stone, focus amber |
| Text (nombre) | Plantilla gerente | `bg-amber-50 text-xs rounded border-slate-300` |
| Text (horario) | Schedule | `bg-amber-50` o `bg-rose-50` si FRANCO |
| Currency inline | Payroll, cashflow | `inputMode="numeric"`, parse con `parseCurrency` |
| Select | Agregar puesto | `rounded border-slate-300 bg-white text-xs` |

### Parsing / display

Siempre vía `lib/format.ts`: `parseNumber`, `parseCurrency`, `formatCurrency`, `formatCovers`, `formatPercent`.

### Validación

- Parse fallido: mostrar **error inline** (`text-xs text-red-600`) — migración desde validación silenciosa actual.
- No actualizar estado del modelo hasta que el valor sea válido.

### Submit

Si el formulario tiene acción de guardado explícita: botón alineado a la derecha (`flex justify-end mt-4`), estilo tab activo o primario violeta.

### Labels

- Block label: `text-sm font-medium text-{accent}-900`
- Label KPI: `text-xs font-medium uppercase tracking-wide text-stone-500`

---

## Botones

### Variantes existentes (solo `<button>` nativo)

| Variante | Clases | Uso |
|----------|--------|-----|
| Tab activo | `rounded-full px-4 py-2 text-sm font-medium bg-violet-800 text-white shadow-sm` | Nav pestañas |
| Tab inactivo | `rounded-full px-4 py-2 border border-stone-300 bg-white text-stone-700 hover:border-violet-400` | Nav pestañas |
| Secundario / export | `rounded-full border border-stone-300 bg-white … hover:border-emerald-500 hover:text-emerald-700` | Exportar informe |
| Collapsible trigger | Full-width `bg-slate-800 hover:bg-slate-700` | Acordeón staffing |
| Destructivo mínimo | `text-red-600 hover:bg-red-50` | Solo dentro de flujo con confirmación (regla 5) |

### Reglas

- Siempre `type="button"` (no submit; no hay forms HTML).
- Forma pill (`rounded-full`) solo para acciones de nav/toolbar.
- No hay botón primario CTA aparte del tab activo.
- No hay estados `disabled` estilizados (no usados).

### Pendiente (no implementado)

Botón primario de acción, botón ghost, icon-only button component.

---

## Estados vacíos

**Regla obligatoria (consistency rule 6):** título + descripción + una acción clara.

Componente: `components/ui/EmptyState.tsx`

```tsx
<EmptyState
  title="Sin personal en turno AM"
  description="Agregá al menos una persona para cubrir la dotación sugerida."
  action={{ label: "Agregar puesto", onClick: … }}
/>
```

Estilos: contenedor `py-8 text-center`; título `text-sm font-semibold text-stone-900`; descripción `text-sm text-stone-500 mt-1`; acción botón secundario o link violeta.

### Legacy (migrar)

| Situación | Patrón actual | Cumple regla 6 |
|-----------|---------------|----------------|
| Turno AM/PM vacío (plantilla) | `EmptyState` con acción en modo editable | Sí (editable) / parcial (solo lectura) |
| Valor nulo | `—` | N/A (celda, no pantalla vacía) |
| Rol inactivo | `opacity-50` + INACTIVO | No |

---

## Modales / sheets

**No implementados** en la app React. No usar `<dialog>`, overlays ni drawers hasta definir el componente.

Export HTML (`lib/export-html.ts`) es descarga de archivo, no modal.

Si se necesitan en el futuro:

- Preferir **sheet lateral** para edición de parámetros largos.
- **Modal centrado obligatorio para confirmaciones destructivas** (regla 5).
- Backdrop: `bg-stone-900/50`.
- Radio: `rounded-xl` en modal; sheet full-height derecha.

---

## Layout de dashboard

```
┌─────────────────────────────────────────────────────────┐
│ AppHeader (sticky visual: border-b bg-white)            │
│  eyebrow · título serif · descripción                   │
│  [tabs pill]                    [export secundario]     │
├─────────────────────────────────────────────────────────┤
│ PageLayout (max-w-6xl | max-w-[1400px])                 │
│  ┌─ Driver / KPIs (grid) ─────────────────────────┐    │
│  ├─ Sección principal (tabla full-width) ──────────┤    │
│  ├─ Secciones colapsables (staffing) ──────────────┤    │
│  └─ Parámetros del modelo (debajo, staffing/cashflow)   │
└─────────────────────────────────────────────────────────┘
```

### Orden por pestaña

| Pestaña | Orden vertical |
|---------|----------------|
| Operativa | Driver → KPIs → distribución → matrices → ticket → resumen |
| Staffing | Driver → matriz madurez → (colapsables) params, rush, demanda, plantilla, acciones, equipo |
| Payroll | KPIs → tabla nómina → análisis cocina → refuerzos |
| Cashflow | KPIs año 1 → incidencia → EERR 12 meses → parámetros |

### Fondo

`CasaOrtizApp`: `min-h-full bg-stone-100`.

### Acciones primarias

Toolbar del header (`AppHeader`): tabs a la izquierda del bloque derecho; **acción primaria global (Exportar) siempre a la derecha** (`sm:items-end`, `flex-col` en mobile).

---

## Mobile

**Enfoque actual: desktop-first con degradación.**

| Comportamiento | Implementación |
|----------------|----------------|
| Tablas anchas | `overflow-x-auto` + `min-w-[720px–980px]` |
| Nav tabs | `flex-wrap gap-2` |
| Header | `flex-col lg:flex-row lg:items-end` |
| KPI grid | `sm:grid-cols-2 lg:grid-cols-4` |
| Cashflow 12 meses | Optimizado para ancho completo desktop; en mobile habrá scroll horizontal |

### No implementado

- Bottom nav
- Cards apiladas en lugar de tablas
- Tipografía reducida sistemática en `< sm`
- Touch targets 44px explícitos

Al agregar features mobile, priorizar: driver + KPIs legibles, tablas con scroll, tabs wrap.

---

## Componentes permitidos

### Primitivas UI (`components/ui/`)

| Componente | Cuándo usar |
|------------|-------------|
| `PageLayout` | Contenedor raíz de cada pestaña |
| `KpiCard` | Métrica suelta en grid |
| `SectionCard` | Bloque con header de color |
| `CollapsibleSection` | Bloque opcional persistido en localStorage |
| `EmptyState` | Estado vacío con título, descripción y acción |
| `ConfirmDialog` | Confirmación de acciones destructivas |

### Componentes de dominio (`components/`)

`AppHeader`, `Dashboard`, `StaffingDashboard`, `PayrollDashboard`, `CashflowDashboard`, `WeeklyMatrixTable`, `TicketMatrixEditor`, `MaturityMatrix`, `StaffRosterTable`, `StaffingParamsEditor`.

### Librerías / utilidades

| Permitido | Notas |
|-----------|-------|
| Tailwind CSS v4 | Único sistema de estilos |
| `lib/format.ts` | Formato y parse de números |
| `lib/ui/tokens.ts` | Colores semánticos, inputs |
| `lib/ui/table-styles.ts` | Estilos de tabla |
| `lib/config.ts` | Constantes de dominio |
| SVG inline | Solo iconos puntuales (export en header) |
| `useMemo` / `useState` / `useEffect` | Estado local y derivado |

---

## Componentes prohibidos

| Prohibido | Motivo |
|-----------|--------|
| shadcn/ui, Radix, MUI, Chakra, Ant Design | No están en el proyecto; evitar dependencias UI |
| CSS modules / styled-components | Tailwind es el único canal |
| Colores hex en JSX | Usar tokens Tailwind o `tokens.ts` |
| `bg-amber-50` en celdas readonly | Rompe convención editabilidad |
| Nuevo `KpiCard` / header inline duplicado | Usar `components/ui/` |
| Constantes `headerCell` locales en tablas nuevas | Usar `table-styles.ts` |
| Modales ad-hoc sin componente base | Usar `ConfirmDialog` cuando exista |
| `alert()` / `window.confirm()` | Usar modal de confirmación del design system |
| Charts libraries (recharts, etc.) | No hay gráficos en la app |
| Emojis como iconografía | No usados en el proyecto |

### Migración pendiente (permitido temporalmente)

Tablas y cards que aún definen estilos inline (`PayrollDashboard`, `MaturityMatrix`, `StaffRosterTable`) — no replicar el patrón en código nuevo.

---

## Formato de datos (`lib/format.ts`)

| Función | Uso |
|---------|-----|
| `formatCurrency` | ARS, 0 decimales |
| `formatNumber` | Números generales, 1 decimal max |
| `formatCovers` | Cubiertos enteros |
| `formatPercent(ratio)` | Ratio 0–1 → `"12.3%"` |
| `compactCurrency` | Tablas densas ($1.2M, $450k) |
| `parseNumber` / `parseCurrency` | Inputs editables |

Locale: `es-AR` vía `Intl`.

---

## Deuda de diseño conocida

1. `export-html.ts` — paleta `#1e3a5f` desalineada del resto.
2. Validación de forms silenciosa — sin error inline (regla 8 pendiente).
3. Tablas sin filtros ni menú de acciones por fila (`RowActions` pendiente).
4. Dos shapes de KPI card (payroll inline vs `KpiCard` compartido).

---

## Referencia rápida para agentes

Antes de agregar UI:

1. ¿Existe componente reutilizable? → `components/ui/` y dominio.
2. ¿Token nuevo? → actualizar `DESIGN_SYSTEM.md` primero.
3. ¿Es editable? → `amber-50`.
4. ¿Es tabla? → `table-styles.ts` + reglas de fila/filtros/acciones.
5. ¿Es sección? → `SectionCard` o `CollapsibleSection`.
6. ¿Es métrica suelta? → `KpiCard`.
7. ¿Es página? → `PageLayout` + layout dashboard (regla 3).
8. ¿Acción destructiva? → `ConfirmDialog`.
9. ¿Sin datos? → `EmptyState` (título + descripción + acción).
10. ¿Número? → `tabular-nums` + `lib/format.ts`.
