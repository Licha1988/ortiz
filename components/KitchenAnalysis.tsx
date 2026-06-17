import { formatCovers } from "@/lib/format";
import type { PayrollEntry, PayrollRoleId } from "@/lib/payroll/types";

type KitchenAnalysisProps = {
  monthlyCovers: number;
  entries: PayrollEntry[];
  suggestions: Partial<Record<PayrollRoleId, number>>;
};

const elasticityBadge: Record<string, string> = {
  alta: "bg-sky-100 text-sky-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-orange-100 text-orange-700",
  ninguna: "bg-violet-100 text-violet-700",
};

const elasticityNote: Record<string, string> = {
  ninguna: "Siempre presente, no depende de la demanda",
  baja: "Puesto especializado, difícil de absorber o reemplazar en baja demanda",
  media: "Puede combinarse con otro puesto hasta cierto volumen",
  alta: "Escala directamente con el volumen de cubiertos",
};

export default function KitchenAnalysis({
  monthlyCovers,
  entries,
  suggestions,
}: KitchenAnalysisProps) {
  const kitchenEntries = entries.filter(
    (e) => e.category === "boh",
  );

  return (
    <section className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
      <div className="bg-slate-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white">
          Análisis de cocina — equipo requerido según demanda
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          {formatCovers(monthlyCovers)} cub/mes · La cocina tiene menos elasticidad que el salón
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {kitchenEntries.map((entry) => {
          const sugg = suggestions[entry.roleId] ?? 0;
          const active = sugg > 0;

          return (
            <div
              key={entry.roleId}
              className={`grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[14rem_1fr_auto] ${
                !active ? "opacity-50" : ""
              }`}
            >
              {/* Role name + badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-medium text-slate-800">{entry.label}</p>
                {entry.isEssential && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                    esencial
                  </span>
                )}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${elasticityBadge[entry.elasticity]}`}
                >
                  {entry.elasticity}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    entry.dependency === "fijo"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {entry.dependency}
                </span>
              </div>

              {/* Analysis text */}
              <p
                className={`text-sm ${
                  !active
                    ? "text-stone-400"
                    : entry.isEssential
                      ? "text-violet-700"
                      : "text-emerald-700"
                }`}
              >
                {!active ? (
                  <>
                    <span className="font-semibold">INACTIVO</span>
                    {entry.kitchenCoversThreshold
                      ? ` — Se activa a partir de ${formatCovers(entry.kitchenCoversThreshold)} cub/mes (actual: ${formatCovers(monthlyCovers)})`
                      : ""}
                  </>
                ) : (
                  <>
                    <span className="font-semibold">
                      {entry.isEssential ? "SIEMPRE ACTIVO" : `ACTIVO — ${sugg} persona${sugg > 1 ? "s" : ""}`}
                    </span>
                    {entry.kitchenCoversPerPerson && !entry.isEssential
                      ? ` · ${formatCovers(entry.kitchenCoversPerPerson)} cub/persona · ${elasticityNote[entry.elasticity]}`
                      : ` · ${elasticityNote[entry.elasticity]}`}
                    {entry.kitchenCoversThreshold && (
                      <span className="text-stone-400">
                        {" "}(umbral: {formatCovers(entry.kitchenCoversThreshold)} cub/mes)
                      </span>
                    )}
                  </>
                )}
              </p>

              {/* Cantidad sugerida pill */}
              <div className="flex items-center justify-end">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                    !active
                      ? "bg-stone-100 text-stone-400"
                      : entry.isEssential
                        ? "bg-violet-100 text-violet-800"
                        : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {sugg}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="text-xs text-slate-500">
          <strong>Elasticidad ninguna</strong>: siempre presentes (Lisandro, Bruno Bonnao).{" "}
          <strong>Baja</strong>: especialización requerida.{" "}
          <strong>Media/Alta</strong>: escalan con cubiertos.
        </p>
      </div>
    </section>
  );
}
