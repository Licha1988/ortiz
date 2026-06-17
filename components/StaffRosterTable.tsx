"use client";

import { dayShort } from "@/lib/format";
import {
  getMemberDisplayGroup,
  getMemberRoleLabel,
  getMemberSortRank,
  getShiftCode,
} from "@/lib/staffing/schedules";
import type { StaffMember } from "@/lib/staffing/types";
import { DAYS, type Day } from "@/lib/types";

type StaffRosterTableProps = {
  title: string;
  subtitle?: string;
  members: StaffMember[];
  editable?: boolean;
  splitByShift?: boolean;
  onNameChange?: (id: string, name: string) => void;
  onScheduleChange?: (id: string, day: Day, value: string) => void;
  onRemove?: (id: string) => void;
  footer?: React.ReactNode;
};

const headerCell =
  "border border-slate-400 bg-slate-700 px-2 py-2 text-xs font-semibold text-white whitespace-nowrap";
const bodyCell =
  "border border-slate-300 px-2 py-1.5 text-xs text-center whitespace-nowrap";

const SHIFT_LABELS = {
  fixed: { label: "Fijos — independientes de turno", bg: "bg-stone-700", border: "border-stone-500" },
  am: { label: "Turno AM — 9:00 a 17:00", bg: "bg-sky-800", border: "border-sky-600" },
  pm: { label: "Turno PM — 17:00 al cierre", bg: "bg-indigo-800", border: "border-indigo-600" },
} as const;

type MemberRowProps = {
  member: StaffMember;
  editable: boolean;
  onNameChange?: (id: string, name: string) => void;
  onScheduleChange?: (id: string, day: Day, value: string) => void;
  onRemove?: (id: string) => void;
};

function MemberRow({ member, editable, onNameChange, onScheduleChange, onRemove }: MemberRowProps) {
  if (member.noSchedule) {
    return (
      <tr className="bg-stone-50">
        {editable && <td className={`${bodyCell} p-1`} />}
        <td className={`${bodyCell} text-left`}>
          {editable && onNameChange ? (
            <input
              type="text"
              value={member.name}
              onChange={(e) => onNameChange(member.id, e.target.value)}
              placeholder="Nombre"
              className="w-full min-w-[7rem] rounded border border-slate-300 bg-amber-50 px-2 py-1 text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
            />
          ) : (
            member.name || "—"
          )}
        </td>
        <td className={`${bodyCell} text-left`}>{getMemberRoleLabel(member)}</td>
        <td className={bodyCell}>{member.roleType}</td>
        <td className={bodyCell}>{getShiftCode(member.roleType)}</td>
        <td
          colSpan={DAYS.length + 2}
          className={`${bodyCell} italic text-stone-400`}
        >
          Sin horario fijo asignado
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-white even:bg-slate-50">
      {editable && (
        <td className={`${bodyCell} p-1`}>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(member.id)}
              className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
              aria-label="Quitar persona"
            >
              ×
            </button>
          )}
        </td>
      )}
      <td className={`${bodyCell} text-left`}>
        {editable && onNameChange ? (
          <input
            type="text"
            value={member.name}
            onChange={(e) => onNameChange(member.id, e.target.value)}
            placeholder="Nombre"
            className="w-full min-w-[7rem] rounded border border-slate-300 bg-amber-50 px-2 py-1 text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
          />
        ) : (
          member.name || "—"
        )}
      </td>
      <td className={`${bodyCell} text-left`}>{getMemberRoleLabel(member)}</td>
      <td className={bodyCell}>{member.roleType}</td>
      <td className={bodyCell}>{getShiftCode(member.roleType)}</td>
      {DAYS.map((day) => {
        const value = member.schedule[day];
        const isFranco = value === "FRANCO";
        return (
          <td
            key={day}
            className={`${bodyCell} ${isFranco ? "bg-rose-100 font-medium text-rose-800" : ""}`}
          >
            {editable && onScheduleChange ? (
              <input
                type="text"
                value={value}
                onChange={(e) => onScheduleChange(member.id, day, e.target.value)}
                className={`w-full min-w-[5.5rem] rounded border px-1 py-0.5 text-center text-xs outline-none focus:ring-1 focus:ring-violet-300 ${
                  isFranco
                    ? "border-rose-300 bg-rose-50"
                    : "border-slate-300 bg-amber-50"
                }`}
              />
            ) : (
              value
            )}
          </td>
        );
      })}
      <td className={bodyCell}>
        {member.dayOff ? dayShort(member.dayOff) : "—"}
      </td>
      <td className={`${bodyCell} font-semibold`}>
        {Math.round(member.weeklyHours)}
      </td>
    </tr>
  );
}

function ShiftSectionHeader({
  shift,
  count,
  colSpan,
}: {
  shift: keyof typeof SHIFT_LABELS;
  count: number;
  colSpan: number;
}) {
  const { label, bg } = SHIFT_LABELS[shift];
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={`${bg} border border-slate-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white`}
      >
        {label}
        <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
          {count} persona{count !== 1 ? "s" : ""}
        </span>
      </td>
    </tr>
  );
}

export default function StaffRosterTable({
  title,
  subtitle,
  members,
  editable = false,
  splitByShift = false,
  onNameChange,
  onScheduleChange,
  onRemove,
  footer,
}: StaffRosterTableProps) {
  const colCount = (editable ? 1 : 0) + 5 + DAYS.length + 2; // remove + name + label + type + shift + days + franco + hs

  const sortedMembers = [...members].sort(
    (a, b) => getMemberSortRank(a) - getMemberSortRank(b) || a.id.localeCompare(b.id),
  );

  const fixedMembers = splitByShift
    ? sortedMembers.filter((m) => getMemberDisplayGroup(m) === "fixed")
    : [];
  const amMembers = splitByShift
    ? sortedMembers.filter((m) => getMemberDisplayGroup(m) === "am")
    : [];
  const pmMembers = splitByShift
    ? sortedMembers.filter((m) => getMemberDisplayGroup(m) === "pm")
    : [];

  const rowProps = { editable, onNameChange, onScheduleChange, onRemove };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
      <div className="bg-slate-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-300">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              {editable && (
                <th className={`${headerCell} w-8`} aria-label="Acciones" />
              )}
              <th className={`${headerCell} text-left`}>Nombre</th>
              <th className={headerCell}>Rol</th>
              <th className={headerCell}>Tipo</th>
              <th className={headerCell}>Turno</th>
              {DAYS.map((day) => (
                <th key={day} className={headerCell}>
                  {dayShort(day)}
                </th>
              ))}
              <th className={headerCell}>Franco</th>
              <th className={headerCell}>Hs/Sem</th>
            </tr>
          </thead>
          <tbody>
            {splitByShift ? (
              <>
                {fixedMembers.length > 0 && (
                  <>
                    <ShiftSectionHeader shift="fixed" count={fixedMembers.length} colSpan={colCount} />
                    {fixedMembers.map((m) => (
                      <MemberRow key={m.id} member={m} {...rowProps} />
                    ))}
                  </>
                )}

                <ShiftSectionHeader shift="am" count={amMembers.length} colSpan={colCount} />
                {amMembers.map((m) => (
                  <MemberRow key={m.id} member={m} {...rowProps} />
                ))}
                {amMembers.length === 0 && (
                  <tr>
                    <td colSpan={colCount} className="border border-slate-200 px-4 py-3 text-center text-xs text-stone-400">
                      Sin personal asignado al turno AM
                    </td>
                  </tr>
                )}

                <ShiftSectionHeader shift="pm" count={pmMembers.length} colSpan={colCount} />
                {pmMembers.map((m) => (
                  <MemberRow key={m.id} member={m} {...rowProps} />
                ))}
                {pmMembers.length === 0 && (
                  <tr>
                    <td colSpan={colCount} className="border border-slate-200 px-4 py-3 text-center text-xs text-stone-400">
                      Sin personal asignado al turno PM
                    </td>
                  </tr>
                )}

              </>
            ) : (
              sortedMembers.map((m) => (
                <MemberRow key={m.id} member={m} {...rowProps} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="border-t border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {footer}
        </div>
      )}
    </div>
  );
}
