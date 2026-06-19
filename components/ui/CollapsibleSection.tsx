"use client";

import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
};

export default function CollapsibleSection({
  id,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-4 bg-slate-800 px-4 py-3 text-left text-white transition hover:bg-slate-700"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-slate-300">{subtitle}</span>}
        </span>
        <span className="text-lg font-bold" aria-hidden="true">
          {open ? "▼" : "▶"}
        </span>
      </button>
      {open && <div className="p-0">{children}</div>}
    </section>
  );
}
