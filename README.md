# Casa Ortiz — Gestión operativa

Dashboard interactivo para planificación operativa, dotación de personal, nómina y cashflow del restaurante Casa Ortiz.

**Deploy:** [ortiz-iota.vercel.app](https://ortiz-iota.vercel.app)

## Pestañas

| Pestaña | Descripción |
|---------|-------------|
| Gestión operativa | Cubiertos, ticket por franja, facturación proyectada |
| Recurso humano | Matriz de madurez, plantilla sugerida, parámetros de rush |
| Payroll | Nómina contratada vs sugerida, costo sobre ventas |
| Cashflow | EERR mensual año 1 con inputs editables mes a mes |

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # validación de producción
npm run lint
```

## Export HTML standalone

Para compartir una versión interactiva que funciona con doble clic (sin servidor):

```bash
npm run export   # genera casa-ortiz-interactive.html
```

## Estructura del proyecto

```
app/              Next.js App Router (entry)
components/       UI por pestaña + components/ui/ (primitivas)
lib/              Lógica de negocio, format, config, tokens
scripts/          Post-proceso del export Vite
```

Documentación para agentes y diseño: `AGENTS.md`, `DESIGN_SYSTEM.md`, `.cursor/rules/project.mdc`.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Vite (export standalone)
