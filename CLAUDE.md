@AGENTS.md

# Notas para Claude (Casa Ortiz)

Seguí `AGENTS.md` y `DESIGN_SYSTEM.md` (sección **Design consistency rules**).

## Fricciones frecuentes

- **PowerShell**: encadená con `;`. `&&` falla. Commits multilínea con here-strings (`@" ... "@`).
- **No derivar estado en `useEffect`**. Usá `useMemo`.
- **Roles**: `StaffRoleType` (staffing) y `PayrollRoleId` (payroll) se unen en `staffingToPayrollSuggestions()`. Al tocar roles, revisar ambos módulos + `lib/export-html.ts`.
- **Claves legacy de cocina AM**: `PAR_AM`/`FUE_AM`/etc. no significan lo que dicen las siglas.
- **Cashflow es independiente** del driver operativo.
- **Nombre del chef**: siempre "Bruno Bonnano".
- Validá con `npm run build` + `npm run lint`. Commit/push solo a pedido del usuario.
