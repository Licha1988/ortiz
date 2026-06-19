export const CASHFLOW_MONTHS = [
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
] as const;

export type CashflowMonth = (typeof CASHFLOW_MONTHS)[number];

export type CashflowMonthInput = {
  month: CashflowMonth;
  covers: number;
  ticket: number;
  /** Costo operativo (nómina del equipo, sin gestión). */
  payroll: number;
  /** Costo de gestión (Lisandro + Bruno). */
  managementCost: number;
};

export type CashflowParams = {
  cmvPct: number;
  deliveryPct: number;
  additionalFeePct: number;
  commissionTaxPct: number;
  reinvestmentPct: number;
  incomeTaxPct: number;
  layoffReservePct: number;
  rent: number;
  utilities: number;
  marketing: number;
  operatingExpenses: number;
  honorarios: number;
  maintenance: number;
  bazar: number;
};

export type CashflowMonthResult = CashflowMonthInput & {
  sales: number;
  cmv: number;
  deliveryCost: number;
  additionalFees: number;
  commissionTaxes: number;
  maintenance: number;
  bazar: number;
  reinvestment: number;
  variableCosts: number;
  grossMargin: number;
  aguinaldoProvision: number;
  structureCosts: number;
  fixedCosts: number;
  operatingResult: number;
  managementCost: number;
  incomeTax: number;
  netIncome: number;
  layoffReserve: number;
};

export type CashflowSummary = {
  months: CashflowMonthResult[];
  yearCovers: number;
  yearSales: number;
  yearVariableCosts: number;
  yearGrossMargin: number;
  yearStructureCosts: number;
  yearFixedCosts: number;
  yearOperatingResult: number;
  yearManagementCost: number;
  yearIncomeTax: number;
  yearNetIncome: number;
  yearLayoffReserve: number;
};

export const DEFAULT_CASHFLOW_PARAMS: CashflowParams = {
  cmvPct: 0.34,
  deliveryPct: 0.015,
  additionalFeePct: 0.0025,
  commissionTaxPct: 0.11,
  reinvestmentPct: 0.01,
  incomeTaxPct: 0.05,
  layoffReservePct: 0.01,
  rent: 12500000,
  utilities: 6800000,
  marketing: 2000000,
  operatingExpenses: 3000000,
  honorarios: 2300000,
  maintenance: 1000000,
  bazar: 400000,
};

export function calculateCashflow(
  params: CashflowParams,
  monthInputs: CashflowMonthInput[],
): CashflowSummary {
  const months = monthInputs.map((month): CashflowMonthResult => {
    const sales = month.covers * month.ticket;

    const cmv = sales * params.cmvPct;
    const deliveryCost = sales * params.deliveryPct;
    const additionalFees = sales * params.additionalFeePct;
    const commissionTaxes = sales * params.commissionTaxPct;
    const reinvestment = sales * params.reinvestmentPct;
    const variableCosts =
      cmv + deliveryCost + additionalFees + commissionTaxes + reinvestment;
    const grossMargin = sales - variableCosts;

    const maintenance = params.maintenance;
    const bazar = params.bazar;
    const aguinaldoProvision = month.payroll / 12;
    const structureCosts =
      month.payroll +
      params.rent +
      params.utilities +
      params.marketing +
      params.operatingExpenses +
      params.honorarios +
      maintenance +
      bazar +
      aguinaldoProvision;

    const operatingResult = grossMargin - structureCosts;
    const managementCost = month.managementCost;
    const fixedCosts = structureCosts + managementCost;
    const resultBeforeTax = operatingResult - managementCost;
    const incomeTax = resultBeforeTax > 0 ? resultBeforeTax * params.incomeTaxPct : 0;
    const netIncome = resultBeforeTax - incomeTax;
    const layoffReserve = sales * params.layoffReservePct;

    return {
      ...month,
      sales,
      cmv,
      deliveryCost,
      additionalFees,
      commissionTaxes,
      maintenance,
      bazar,
      reinvestment,
      variableCosts,
      grossMargin,
      aguinaldoProvision,
      structureCosts,
      fixedCosts,
      operatingResult,
      managementCost,
      incomeTax,
      netIncome,
      layoffReserve,
    };
  });

  const sum = (selector: (month: CashflowMonthResult) => number) =>
    months.reduce((total, month) => total + selector(month), 0);

  return {
    months,
    yearCovers: sum((month) => month.covers),
    yearSales: sum((month) => month.sales),
    yearVariableCosts: sum((month) => month.variableCosts),
    yearGrossMargin: sum((month) => month.grossMargin),
    yearStructureCosts: sum((month) => month.structureCosts),
    yearFixedCosts: sum((month) => month.fixedCosts),
    yearOperatingResult: sum((month) => month.operatingResult),
    yearManagementCost: sum((month) => month.managementCost),
    yearIncomeTax: sum((month) => month.incomeTax),
    yearNetIncome: sum((month) => month.netIncome),
    yearLayoffReserve: sum((month) => month.layoffReserve),
  };
}
