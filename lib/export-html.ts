import { DAYS, TIME_SLOTS } from "@/lib/types";
import type { DashboardResults } from "@/lib/types";
import { MANAGEMENT_ROLE_IDS } from "@/lib/payroll/data";
import type { PayrollSummary } from "@/lib/payroll/types";
import { ROLE_CONFIG } from "@/lib/staffing/role-config";
import type { StaffMember } from "@/lib/staffing/types";

// ─── formatters (standalone so the HTML fn has no external deps at runtime) ─────

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
}
function fmtM(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

const DAY_LABEL: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  "miércoles": "Mié",
  jueves: "Jue",
  viernes: "Vie",
  "sábado": "Sáb",
  domingo: "Dom",
};
const SLOT_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
};

function healthColor(pct: number): string {
  if (pct <= 30) return "#059669"; // emerald
  if (pct <= 40) return "#d97706"; // amber
  return "#dc2626"; // red
}
function healthLabel(pct: number): string {
  if (pct <= 30) return "Saludable";
  if (pct <= 40) return "Atención";
  return "Crítico";
}

// ─── Main export function ────────────────────────────────────────────────────

export function generateReportHTML(
  monthlyCovers: number,
  dashboardResults: DashboardResults,
  payrollSummary: PayrollSummary,
  managerTeam: StaffMember[],
): string {
  const { monthlyRevenue, coversMatrix, slotTotals, dayTotals } = dashboardResults;
  const today = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ── KPI values ──────────────────────────────────────────────────────────────
  const equipoPct = payrollSummary.equipoToRevenuePercent;
  const totalPct  = payrollSummary.payrollToRevenuePercent;
  const wkCovers  = dashboardResults.weeklyCovers;

  // ── Covers matrix rows ───────────────────────────────────────────────────────
  const coversMatrixRows = TIME_SLOTS.map((slot) => {
    const cells = DAYS.map(
      (d) => `<td>${fmt(coversMatrix[slot][d] ?? 0)}</td>`,
    ).join("");
    return `<tr><td class="row-label">${SLOT_LABEL[slot]}</td>${cells}<td class="total-col">${fmt(slotTotals[slot] ?? 0)}</td></tr>`;
  }).join("\n");

  const dayHeaderCells = DAYS.map(
    (d) => `<th>${DAY_LABEL[d]}</th>`,
  ).join("");

  const dayTotalCells = DAYS.map(
    (d) => `<td class="total-row">${fmt(dayTotals[d] ?? 0)}</td>`,
  ).join("");

  const grandTotal = DAYS.reduce((s, d) => s + (dayTotals[d] ?? 0), 0);

  // ── Staff roster rows ────────────────────────────────────────────────────────
  const rosterRows = managerTeam.map((m) => {
    const roleLabel = ROLE_CONFIG[m.roleType]?.label ?? m.roleType;
    const dayCells = m.noSchedule
      ? `<td colspan="${DAYS.length}" style="color:#a8a29e;font-style:italic;text-align:center;">sin horario fijo asignado</td>`
      : DAYS.map((d) => {
          const val = m.schedule[d] ?? "";
          const isFranco = val === "FRANCO";
          return `<td class="${isFranco ? "franco" : "shift"}">${isFranco ? "OFF" : val}</td>`;
        }).join("");
    return `<tr>
      <td class="name-col">${m.name || "<em>—</em>"}</td>
      <td class="role-col">${roleLabel}</td>
      ${dayCells}
      <td class="hours-col">${m.noSchedule ? "—" : m.weeklyHours > 0 ? m.weeklyHours + " h" : "—"}</td>
    </tr>`;
  }).join("\n");

  // ── Payroll rows ─────────────────────────────────────────────────────────────
  const mgmtRows = payrollSummary.rows.filter((r) =>
    MANAGEMENT_ROLE_IDS.has(r.roleId),
  );
  const equipoRows = payrollSummary.rows.filter(
    (r) => !MANAGEMENT_ROLE_IDS.has(r.roleId),
  );

  function payrollRow(r: typeof payrollSummary.rows[0], dimmed = false): string {
    return `<tr class="${dimmed ? "mgmt-row" : ""}">
      <td>${r.label}</td>
      <td class="num">${r.quantity}</td>
      <td class="num">${fmtM(r.netSalary)}</td>
      <td class="num">${r.hasCCSS ? fmtM(r.ccss) : "—"}</td>
      <td class="num">${fmtM(r.grossSalary)}</td>
      <td class="num bold">${fmtM(r.rowTotal)}</td>
    </tr>`;
  }

  const mgmtRowsHtml  = mgmtRows.map((r) => payrollRow(r, true)).join("\n");
  const equipoRowsHtml = equipoRows.map((r) => payrollRow(r)).join("\n");

  const mgmtTotal   = payrollSummary.managementSubtotal;
  const equipoTotal = payrollSummary.equipoSubtotal;
  const grandTotal2 = payrollSummary.totalPayroll;

  // ─────────────────────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Casa Ortiz — Informe operacional</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1c1917;
      background: #f5f5f4;
      padding: 24px;
    }
    .page { max-width: 1100px; margin: 0 auto; }

    /* Header */
    .report-header {
      background: #1e3a5f;
      color: #fff;
      border-radius: 10px 10px 0 0;
      padding: 28px 32px 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .report-header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .report-header .sub { font-size: 13px; color: #93c5fd; margin-top: 4px; }
    .report-header .meta { text-align: right; font-size: 12px; color: #93c5fd; }
    .report-header .meta strong { display: block; font-size: 14px; color: #fff; }

    /* Sections */
    .section {
      background: #fff;
      border: 1px solid #e7e5e4;
      border-top: none;
      padding: 24px 28px;
    }
    .section:last-child { border-radius: 0 0 10px 10px; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #57534e;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e7e5e4;
    }

    /* KPI grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
    }
    .kpi-card {
      background: #f9f7f5;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .kpi-label { font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 20px; font-weight: 700; margin-top: 4px; color: #1c1917; }
    .kpi-sub   { font-size: 11px; color: #a8a29e; margin-top: 2px; }

    /* Tables — shared */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th {
      background: #1e3a5f;
      color: #fff;
      font-weight: 600;
      padding: 7px 10px;
      text-align: center;
      font-size: 11px;
      letter-spacing: .04em;
    }
    th.left, td.row-label, td.name-col, td.role-col { text-align: left; }
    td { padding: 6px 10px; border-bottom: 1px solid #f0ede9; text-align: center; }
    tr:hover td { background: #faf9f8; }
    td.total-col { font-weight: 700; background: #f0ede9; }
    td.total-row { font-weight: 700; background: #f0ede9; }
    .row-label { color: #44403c; font-weight: 500; text-align: left; }
    .grand-total td { background: #1e3a5f !important; color: #fff; font-weight: 700; }

    /* Roster */
    .name-col  { font-weight: 600; min-width: 130px; }
    .role-col  { color: #78716c; min-width: 100px; }
    .hours-col { font-weight: 600; color: #1e3a5f; }
    td.franco  { color: #a8a29e; font-size: 10px; }
    td.shift   { color: #1c1917; font-size: 11px; }

    /* Payroll */
    .num  { text-align: right; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 700; }
    .mgmt-row td { color: #78716c; background: #fafaf9; font-style: italic; }
    .section-subhead td {
      background: #1e3a5f;
      color: #93c5fd;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .07em;
      padding: 5px 10px;
    }
    .subtotal-row td { background: #f0ede9; font-weight: 700; }
    .total-payroll td { background: #1e3a5f; color: #fff; font-weight: 700; }

    /* Health badge */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
    }

    /* Print */
    @media print {
      body { background: #fff; padding: 0; }
      .section { border: none; }
      .report-header { border-radius: 0; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="report-header">
    <div>
      <h1>Casa Ortiz</h1>
      <div class="sub">Informe operacional · Planificación de recursos humanos y nómina</div>
    </div>
    <div class="meta">
      <strong>${today}</strong>
      Escenario: ${fmt(monthlyCovers)} cubiertos / mes
    </div>
  </div>

  <!-- KPIs -->
  <div class="section">
    <div class="section-title">Indicadores clave del escenario</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Cubiertos mensuales</div>
        <div class="kpi-value">${fmt(monthlyCovers)}</div>
        <div class="kpi-sub">${fmt(wkCovers)} / semana</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Facturación mensual</div>
        <div class="kpi-value" style="font-size:16px">${fmtM(monthlyRevenue)}</div>
        <div class="kpi-sub">Ticket prom. ${fmtM(dashboardResults.weightedAvgTicket)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Costo de equipo</div>
        <div class="kpi-value" style="color:${healthColor(equipoPct)}">${fmtPct(equipoPct)}</div>
        <div class="kpi-sub">
          <span class="badge" style="background:${healthColor(equipoPct)}">${healthLabel(equipoPct)}</span>
          ${fmtM(payrollSummary.equipoSubtotal)}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Gestión operativa</div>
        <div class="kpi-value" style="font-size:16px">${fmtM(payrollSummary.managementSubtotal)}</div>
        <div class="kpi-sub">${fmtPct(payrollSummary.managementToRevenuePercent)} de la facturación</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Nómina total</div>
        <div class="kpi-value" style="color:${healthColor(totalPct)};font-size:16px">${fmtM(grandTotal2)}</div>
        <div class="kpi-sub">${fmtPct(totalPct)} de la facturación</div>
      </div>
    </div>
  </div>

  <!-- Covers matrix -->
  <div class="section">
    <div class="section-title">Distribución semanal de cubiertos</div>
    <table>
      <thead>
        <tr>
          <th class="left">Franja</th>
          ${dayHeaderCells}
          <th>SEMANA</th>
        </tr>
      </thead>
      <tbody>
        ${coversMatrixRows}
        <tr class="grand-total">
          <td>TOTAL DÍA</td>
          ${dayTotalCells}
          <td>${fmt(grandTotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Staff roster -->
  <div class="section">
    <div class="section-title">Plantilla del gerente — Mi equipo</div>
    <table>
      <thead>
        <tr>
          <th class="left">Nombre</th>
          <th class="left">Rol</th>
          ${DAYS.map((d) => `<th>${DAY_LABEL[d]}</th>`).join("")}
          <th>Hs/sem</th>
        </tr>
      </thead>
      <tbody>
        ${rosterRows}
      </tbody>
    </table>
  </div>

  <!-- Payroll -->
  <div class="section">
    <div class="section-title">Nómina proyectada — Plantilla del mes</div>
    <table>
      <thead>
        <tr>
          <th class="left">Rol</th>
          <th>Contratado</th>
          <th>Salario neto</th>
          <th>CCSS</th>
          <th>Bruto/pers.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr class="section-subhead"><td colspan="6">Gestión operativa (costo fijo — fuera del equipo)</td></tr>
        ${mgmtRowsHtml}
        <tr class="subtotal-row">
          <td>Subtotal gestión</td>
          <td colspan="4"></td>
          <td class="num">${fmtM(mgmtTotal)}</td>
        </tr>
        <tr class="section-subhead"><td colspan="6">Equipo operativo</td></tr>
        ${equipoRowsHtml}
        <tr class="subtotal-row">
          <td>Subtotal equipo</td>
          <td class="num">${payrollSummary.contractedHeadcount}</td>
          <td colspan="3"></td>
          <td class="num">${fmtM(equipoTotal)}</td>
        </tr>
        <tr class="total-payroll">
          <td>Nómina total (equipo + gestión)</td>
          <td colspan="4"></td>
          <td class="num">${fmtM(grandTotal2)}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top:12px;font-size:11px;color:#a8a29e;">
      CCSS calculado al 34% sobre salario neto. Totales según plantilla cargada por el gerente.
    </p>
  </div>

</div>
</body>
</html>`;
}

/** Triggers a browser download of the generated HTML report. */
export function downloadReport(
  monthlyCovers: number,
  dashboardResults: DashboardResults,
  payrollSummary: PayrollSummary,
  managerTeam: StaffMember[],
): void {
  const html = generateReportHTML(monthlyCovers, dashboardResults, payrollSummary, managerTeam);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `casa-ortiz-informe-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
