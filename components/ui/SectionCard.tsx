import type { ReactNode } from "react";
import { sectionHeaders } from "@/lib/ui/tokens";

type SectionTone = keyof typeof sectionHeaders;

type SectionCardProps = {
  title: string;
  subtitle?: string;
  tone?: SectionTone;
  children: ReactNode;
  /** Centrar título del header (matrices semanales). */
  centered?: boolean;
  className?: string;
};

export default function SectionCard({
  title,
  subtitle,
  tone = "operational",
  children,
  centered = false,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm ${className}`}
    >
      <div
        className={`px-4 py-3 text-sm font-semibold tracking-wide ${sectionHeaders[tone]} ${
          centered ? "text-center" : ""
        }`}
      >
        {title}
        {subtitle && (
          <p className="mt-0.5 text-xs font-normal text-white/75">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
