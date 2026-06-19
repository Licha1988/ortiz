type KpiTone = "stone" | "emerald" | "amber" | "violet";

const toneClasses: Record<KpiTone, string> = {
  stone: "border-stone-200 bg-white text-stone-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
};

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: KpiTone;
};

export default function KpiCard({ label, value, hint, tone = "stone" }: KpiCardProps) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs opacity-60">{hint}</p>}
    </div>
  );
}

export type { KpiTone };
