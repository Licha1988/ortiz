export function getStaffingMaturity(monthlyCovers: number): {
  level: string;
  description: string;
} {
  if (monthlyCovers < 4000) {
    return {
      level: "NIVEL 1 — Apertura (roles combinados)",
      description: "Estructura base con roles fijos y mínima especialización.",
    };
  }
  if (monthlyCovers < 7000) {
    return {
      level: "NIVEL 2 — Crecimiento (especialización parcial)",
      description: "Se activan roles dependientes según picos de demanda.",
    };
  }
  return {
    level: "NIVEL 3 — Consolidación (estructura ampliada)",
    description: "Demanda alta: jefes de salón, caja AM y recepción dedicada.",
  };
}
