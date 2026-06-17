import { formatCovers } from "@/lib/format";
import type { MaturityRoleRow } from "@/lib/staffing/types";

type MaturityMatrixProps = {
  monthlyCovers: number;
  maturityLevel: string;
  roles: MaturityRoleRow[];
  peakDayCovers: number;
  peakMorningCovers: number;
  peakDiurnoBar: number;
  peakVespertinoBar: number;
  peakBarNeed: number;
};

const headerCell =
  "border border-slate-500 bg-slate-700 px-3 py-2.5 text-xs font-semibold text-white";
const bodyCell = "border border-slate-300 px-3 py-2.5 text-sm";

export default function MaturityMatrix({
  monthlyCovers,
  maturityLevel,
  roles,
  peakDayCovers,
  peakMorningCovers,
  peakDiurnoBar,
  peakVespertinoBar,
  peakBarNeed,
}: MaturityMatrixProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
      <div className="bg-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">
          Matriz de madurez — estructura organizacional según drivers operativos
        </h3>
        <p className="mt-1 text-xs text-slate-300">{maturityLevel}</p>
      </div>

      <div className="grid gap-0 border-b border-slate-300 bg-rose-50 sm:grid-cols-3">
        <div className="border-r border-slate-200 px-4 py-3">
          <p className="text-xs font-medium uppercase text-rose-800">Driver</p>
          <p className="mt-1 text-sm text-stone-700">Cubiertos mensuales</p>
          <p className="mt-1 text-lg font-semibold text-stone-900">
            {formatCovers(monthlyCovers)}
          </p>
        </div>
        <div className="border-r border-slate-200 px-4 py-3">
          <p className="text-xs font-medium uppercase text-rose-800">Pico diario</p>
          <p className="mt-1 text-lg font-semibold text-stone-900">
            {formatCovers(peakDayCovers)} cub
          </p>
          <p className="text-xs text-stone-500">AM: {formatCovers(peakMorningCovers)}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-medium uppercase text-rose-800">Barra / Café</p>
          <p className="mt-1 text-lg font-semibold text-stone-900">
            {peakBarNeed} persona{peakBarNeed === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-stone-500">
            Diurno 9–17 h: {peakDiurnoBar} · Vespertino 15 h+: {peakVespertinoBar}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr>
              <th className={`${headerCell} text-left`}>Rol</th>
              <th className={`${headerCell} text-left`}>Estado</th>
              <th className={`${headerCell} text-left`}>Motivo del cambio</th>
              <th className={`${headerCell} text-left`}>Parámetro</th>
              <th className={`${headerCell} text-center`}>Requeridos</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr
                key={role.roleLabel}
                className={role.active ? "bg-emerald-50/60" : "bg-white"}
              >
                <td className={`${bodyCell} font-medium text-stone-900`}>
                  {role.roleLabel}
                </td>
                <td className={bodyCell}>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      role.dependency === "independiente"
                        ? "bg-violet-100 text-violet-800"
                        : role.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {role.dependency === "independiente"
                      ? "Independiente"
                      : role.active
                        ? "Dependiente · activo"
                        : "Dependiente · inactivo"}
                  </span>
                </td>
                <td className={`${bodyCell} text-xs text-stone-600`}>{role.reason}</td>
                <td className={`${bodyCell} text-xs text-stone-600`}>{role.trigger}</td>
                <td className={`${bodyCell} text-center font-semibold text-stone-900`}>
                  {role.required}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
