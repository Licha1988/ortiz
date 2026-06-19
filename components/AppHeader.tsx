"use client";

import { formatNumber } from "@/lib/format";
import type { AppView } from "@/lib/app-view";

type AppHeaderProps = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onExport: () => void;
  username?: string;
  onLogout?: () => void;
  loggingOut?: boolean;
};

const VIEWS: { id: AppView; label: string }[] = [
  { id: "operational", label: "Gesti?n operativa" },
  { id: "cashflow", label: "Cashflow" },
];

export default function AppHeader({
  activeView,
  onViewChange,
  onExport,
  username,
  onLogout,
  loggingOut = false,
}: AppHeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-800">
              Casa Ortiz
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
              {activeView === "operational" ? "Gesti?n operativa" : "Cashflow"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-stone-600">
              {activeView === "operational"
                ? "Facturaci?n, cubiertos, payroll y recurso humano en secciones desplegables."
                : "Proyect? EERR y flujo de caja con cubiertos, ticket y n?mina editables mes a mes."}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <nav className="flex flex-wrap gap-2">
              {VIEWS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => onViewChange(view.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeView === view.id
                      ? "bg-violet-800 text-white shadow-sm"
                      : "border border-stone-300 bg-white text-stone-700 hover:border-violet-400 hover:text-violet-900"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              {username ? (
                <>
                  <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">
                    {username}
                  </span>
                  {onLogout ? (
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={loggingOut}
                      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                    >
                      {loggingOut ? "Saliendo?" : "Salir"}
                    </button>
                  ) : null}
                </>
              ) : null}
              {activeView === "operational" && (
                <p className="text-xs text-stone-400">
                  Semana equivalente: {formatNumber(52 / 12)} semanas / mes
                </p>
              )}
              <button
                type="button"
                onClick={onExport}
                className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                Exportar informe
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
