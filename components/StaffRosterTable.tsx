"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { dayShort, formatCurrency } from "@/lib/format";
import type { PayrollEntry } from "@/lib/payroll/types";
import {
  computeMemberPayrollCost,
  resolveMemberPosition,
} from "@/lib/staffing/payroll-bridge";
import {
  EVENTUAL_INACTIVE_LABEL,
  isEventualShiftActive,
} from "@/lib/staffing/eventual";
import {
  STAFF_POSITION_OPTIONS,
  getPositionLabel,
  type StaffPosition,
} from "@/lib/staffing/positions";
import {
  getMemberDisplayGroup,
  getMemberSortRank,
} from "@/lib/staffing/schedules";
import type { StaffMember } from "@/lib/staffing/types";
import { rosterTableStyles as rt } from "@/lib/ui/table-styles";
import { DAYS, type Day } from "@/lib/types";

type StaffRosterTableProps = {
  title: string;
  subtitle?: string;
  members: StaffMember[];
  payrollEntries: PayrollEntry[];
  editable?: boolean;
  splitByShift?: boolean;
  showPayrollColumns?: boolean;
  onNameChange?: (id: string, name: string) => void;
  onPositionChange?: (id: string, position: StaffPosition) => void;
  onScheduleChange?: (id: string, day: Day, value: string) => void;
  onMoveFranco?: (id: string, fromDay: Day, toDay: Day) => void;
  onRemove?: (id: string) => void;
  onEmptyShiftAction?: (shift: "am" | "pm") => void;
  headerToolbar?: React.ReactNode;
  footer?: React.ReactNode;
};

const headerCell = rt.header;
const bodyCell = rt.body;

const STICKY_REMOVE_LEFT = "left-0";
const STICKY_NAME_LEFT = "left-8";
const STICKY_POSITION_LEFT = "left-[10.5rem]";
const STICKY_NAME_LEFT_READONLY = "left-0";
const STICKY_POSITION_LEFT_READONLY = "left-[8.5rem]";
const stickyEdgeShadow = "shadow-[4px_0_8px_-2px_rgba(15,23,42,0.22)]";

function stickyRowBg(isScheduleLess: boolean, rowIndex: number): string {
  if (isScheduleLess) return "bg-stone-50";
  return rowIndex % 2 === 1 ? "bg-slate-50" : "bg-white";
}

function stickyRemoveClass(bg: string): string {
  return `sticky z-[22] ${STICKY_REMOVE_LEFT} ${bg}`;
}

function stickyNameClass(editable: boolean, bg: string): string {
  return `sticky z-[23] ${editable ? STICKY_NAME_LEFT : STICKY_NAME_LEFT_READONLY} ${bg}`;
}

function stickyPositionClass(editable: boolean, bg: string): string {
  return `sticky z-[24] ${editable ? STICKY_POSITION_LEFT : STICKY_POSITION_LEFT_READONLY} ${stickyEdgeShadow} ${bg}`;
}

function stickyHeaderRemoveClass(): string {
  return `sticky z-[32] ${STICKY_REMOVE_LEFT} bg-slate-700`;
}

function stickyHeaderNameClass(editable: boolean): string {
  return `sticky z-[33] ${editable ? STICKY_NAME_LEFT : STICKY_NAME_LEFT_READONLY} bg-slate-700`;
}

function stickyHeaderPositionClass(editable: boolean): string {
  return `sticky z-[34] ${editable ? STICKY_POSITION_LEFT : STICKY_POSITION_LEFT_READONLY} ${stickyEdgeShadow} bg-slate-700`;
}

const SHIFT_LABELS = {
  am: { label: "Turno AM — 9:00 a 17:00", bg: "bg-sky-800" },
  pm: { label: "Turno PM — 17:00 al cierre", bg: "bg-indigo-800" },
} as const;

function summarizeMembers(members: StaffMember[], payrollEntries: PayrollEntry[]) {
  return members.reduce(
    (acc, member) => {
      const cost = computeMemberPayrollCost(member, payrollEntries);
      acc.net += cost.netSalary;
      acc.ccss += cost.ccss;
      acc.total += cost.totalCost;
      return acc;
    },
    { net: 0, ccss: 0, total: 0 },
  );
}

function PayrollCells({
  member,
  payrollEntries,
}: {
  member: StaffMember;
  payrollEntries: PayrollEntry[];
}) {
  const cost = computeMemberPayrollCost(member, payrollEntries);
  const position = resolveMemberPosition(member);
  const shiftNote =
    position === "eventual" ? (
      <p className="text-[10px] font-normal text-stone-400">por jornadas activadas</p>
    ) : null;

  return (
    <>
      <td className={`${bodyCell} text-right tabular-nums`}>
        <div>{formatCurrency(cost.netSalary)}</div>
        {shiftNote}
      </td>
      <td className={`${bodyCell} text-right tabular-nums`}>
        {cost.hasCCSS ? formatCurrency(cost.ccss) : "—"}
      </td>
      <td className={`${bodyCell} text-right tabular-nums font-semibold`}>
        {formatCurrency(cost.totalCost)}
      </td>
    </>
  );
}

function EventualDayCell({
  value,
  editable,
  onChange,
}: {
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inactive = !isEventualShiftActive(value);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (!editable || !onChange) {
    return inactive ? "Activar" : value;
  }

  if (inactive && !editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full min-w-[5.5rem] rounded px-1 py-0.5 text-center text-xs font-medium text-violet-700 underline decoration-violet-300 underline-offset-2 hover:bg-violet-50 hover:text-violet-900"
      >
        Activar
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={inactive ? "" : value}
      placeholder="09:00-15:00"
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        const trimmed = e.target.value.trim();
        if (!trimmed) {
          onChange(EVENTUAL_INACTIVE_LABEL);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          onChange(EVENTUAL_INACTIVE_LABEL);
          setEditing(false);
        }
      }}
      className="w-full min-w-[5.5rem] rounded border border-violet-300 bg-violet-50 px-1 py-0.5 text-center text-xs outline-none focus:ring-1 focus:ring-violet-300"
    />
  );
}

type MemberRowProps = {
  member: StaffMember;
  payrollEntries: PayrollEntry[];
  editable: boolean;
  showPayrollColumns: boolean;
  rowIndex: number;
  francoDrag: { memberId: string; fromDay: Day } | null;
  francoDropDay: Day | null;
  onNameChange?: (id: string, name: string) => void;
  onPositionChange?: (id: string, position: StaffPosition) => void;
  onScheduleChange?: (id: string, day: Day, value: string) => void;
  onFrancoDragStart?: (memberId: string, day: Day) => void;
  onFrancoDragEnter?: (memberId: string, day: Day) => void;
  onRequestRemove?: (id: string) => void;
};

function RemoveCell({
  editable,
  memberId,
  stickyBg,
  onRequestRemove,
}: {
  editable: boolean;
  memberId: string;
  stickyBg: string;
  onRequestRemove?: (id: string) => void;
}) {
  if (!editable) return null;
  return (
    <td className={`${bodyCell} p-1 ${stickyRemoveClass(stickyBg)}`}>
      {onRequestRemove && (
        <button
          type="button"
          onClick={() => onRequestRemove(memberId)}
          className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
          aria-label="Quitar persona"
        >
          ×
        </button>
      )}
    </td>
  );
}

function MemberRow({
  member,
  payrollEntries,
  editable,
  showPayrollColumns,
  rowIndex,
  francoDrag,
  francoDropDay,
  onNameChange,
  onPositionChange,
  onScheduleChange,
  onFrancoDragStart,
  onFrancoDragEnter,
  onRequestRemove,
}: MemberRowProps) {
  const position = resolveMemberPosition(member);
  const isEventual = position === "eventual";
  const isScheduleLess = member.noSchedule || position === "socio_operativo";
  const stickyBg = stickyRowBg(isScheduleLess, rowIndex);
  const isFrancoDragging = francoDrag?.memberId === member.id;

  return (
    <tr className={stickyBg}>
      <RemoveCell
        editable={editable}
        memberId={member.id}
        stickyBg={stickyBg}
        onRequestRemove={onRequestRemove}
      />
      <td className={`${bodyCell} text-left ${stickyNameClass(editable, stickyBg)}`}>
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
      <td className={`${bodyCell} text-left ${stickyPositionClass(editable, stickyBg)}`}>
        {editable && onPositionChange ? (
          <select
            value={position}
            onChange={(e) => onPositionChange(member.id, e.target.value as StaffPosition)}
            className="w-full min-w-[10rem] rounded border border-slate-300 bg-amber-50 px-2 py-1 text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
          >
            {STAFF_POSITION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          getPositionLabel(position)
        )}
      </td>
      {isScheduleLess ? (
        <td colSpan={DAYS.length + 1} className={`${bodyCell} italic text-stone-400`}>
          Sin horario fijo asignado
        </td>
      ) : (
        <>
          {DAYS.map((day) => {
            const value = member.schedule[day];
            const isFranco = !isEventual && value === "FRANCO";
            const isDropTarget =
              isFrancoDragging &&
              !isEventual &&
              francoDropDay === day &&
              francoDrag?.fromDay !== day;

            return (
              <td
                key={day}
                className={`${bodyCell} ${
                  isFranco ? "bg-rose-100 font-medium text-rose-800" : ""
                } ${isDropTarget ? "ring-2 ring-inset ring-violet-500" : ""} ${
                  isEventual && isEventualShiftActive(value) ? "bg-violet-50" : ""
                }`}
                onPointerEnter={() => {
                  if (
                    !isEventual &&
                    isFrancoDragging &&
                    francoDrag?.fromDay !== day &&
                    onFrancoDragEnter
                  ) {
                    onFrancoDragEnter(member.id, day);
                  }
                }}
              >
                {editable && onScheduleChange ? (
                  isEventual ? (
                    <EventualDayCell
                      value={value}
                      editable={editable}
                      onChange={(next) => onScheduleChange(member.id, day, next)}
                    />
                  ) : isFranco ? (
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onFrancoDragStart?.(member.id, day);
                      }}
                      className={`w-full min-w-[5.5rem] cursor-grab rounded border border-rose-300 bg-rose-50 px-1 py-0.5 text-center text-xs active:cursor-grabbing ${
                        francoDrag?.memberId === member.id && francoDrag.fromDay === day
                          ? "opacity-60"
                          : ""
                      }`}
                      aria-label={`Arrastrar franco de ${dayShort(day)}`}
                    >
                      FRANCO
                    </button>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => onScheduleChange(member.id, day, e.target.value)}
                      className="w-full min-w-[5.5rem] rounded border border-slate-300 bg-amber-50 px-1 py-0.5 text-center text-xs outline-none focus:ring-1 focus:ring-violet-300"
                    />
                  )
                ) : (
                  value
                )}
              </td>
            );
          })}
          <td className={`${bodyCell} font-semibold`}>{Math.round(member.weeklyHours)}</td>
        </>
      )}
      {showPayrollColumns && (
        <PayrollCells member={member} payrollEntries={payrollEntries} />
      )}
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

function SubtotalRow({
  label,
  members,
  payrollEntries,
  leadingColSpan,
}: {
  label: string;
  members: StaffMember[];
  payrollEntries: PayrollEntry[];
  leadingColSpan: number;
}) {
  const totals = summarizeMembers(members, payrollEntries);
  return (
    <tr className="bg-slate-100 font-semibold text-slate-800">
      <td colSpan={leadingColSpan} className={`${bodyCell} text-right`}>
        Subtotal {label}
      </td>
      <td className={`${bodyCell} text-right tabular-nums`}>{formatCurrency(totals.net)}</td>
      <td className={`${bodyCell} text-right tabular-nums`}>{formatCurrency(totals.ccss)}</td>
      <td className={`${bodyCell} text-right tabular-nums`}>{formatCurrency(totals.total)}</td>
    </tr>
  );
}

function EmptyShiftRow({
  colSpan,
  shift,
  editable,
  onEmptyShiftAction,
}: {
  colSpan: number;
  shift: "am" | "pm";
  editable: boolean;
  onEmptyShiftAction?: (shift: "am" | "pm") => void;
}) {
  const label = shift === "am" ? "AM" : "PM";
  return (
    <tr>
      <td colSpan={colSpan} className="border border-slate-200 p-0">
        <EmptyState
          title={`Sin personal en turno ${label}`}
          description={
            editable
              ? "Agregá personas desde el selector de puestos en el encabezado de la tabla."
              : `La demanda actual no requiere personal adicional en turno ${label}.`
          }
          action={
            editable && onEmptyShiftAction
              ? { label: "Agregar puesto", onClick: () => onEmptyShiftAction(shift) }
              : undefined
          }
        />
      </td>
    </tr>
  );
}

export default function StaffRosterTable({
  title,
  subtitle,
  members,
  payrollEntries,
  editable = false,
  splitByShift = false,
  showPayrollColumns = false,
  onNameChange,
  onPositionChange,
  onScheduleChange,
  onMoveFranco,
  onRemove,
  onEmptyShiftAction,
  headerToolbar,
  footer,
}: StaffRosterTableProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [francoDrag, setFrancoDrag] = useState<{ memberId: string; fromDay: Day } | null>(
    null,
  );
  const [francoDropDay, setFrancoDropDay] = useState<Day | null>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const pendingMember = useMemo(
    () => members.find((member) => member.id === pendingRemoveId),
    [members, pendingRemoveId],
  );

  const baseColCount = (editable ? 1 : 0) + 3 + DAYS.length + 1;
  const colCount = baseColCount + (showPayrollColumns ? 3 : 0);
  const subtotalLeadingCols = baseColCount - 3;

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

  const grandTotals = summarizeMembers(members, payrollEntries);

  const rowProps = {
    payrollEntries,
    editable,
    showPayrollColumns,
    francoDrag,
    francoDropDay,
    onNameChange,
    onPositionChange,
    onScheduleChange,
    onFrancoDragStart: (memberId: string, day: Day) => {
      setFrancoDrag({ memberId, fromDay: day });
      setFrancoDropDay(null);
    },
    onFrancoDragEnter: (memberId: string, day: Day) => {
      if (francoDrag?.memberId === memberId) {
        setFrancoDropDay(day);
      }
    },
    onRequestRemove: editable && onRemove ? setPendingRemoveId : undefined,
  };

  useEffect(() => {
    if (!francoDrag) return;

    const finishFrancoDrag = () => {
      if (francoDrag && francoDropDay && onMoveFranco) {
        onMoveFranco(francoDrag.memberId, francoDrag.fromDay, francoDropDay);
      }
      setFrancoDrag(null);
      setFrancoDropDay(null);
    };

    window.addEventListener("pointerup", finishFrancoDrag);
    return () => window.removeEventListener("pointerup", finishFrancoDrag);
  }, [francoDrag, francoDropDay, onMoveFranco]);

  let memberRowIndex = 0;

  function confirmRemove() {
    if (pendingRemoveId && onRemove) {
      onRemove(pendingRemoveId);
    }
    setPendingRemoveId(null);
  }

  useEffect(() => {
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;

    const updateScrollWidth = () => {
      setTableScrollWidth(tableEl.scrollWidth);
    };

    updateScrollWidth();

    const observer = new ResizeObserver(updateScrollWidth);
    observer.observe(tableEl);

    const table = tableEl.querySelector("table");
    if (table) observer.observe(table);

    return () => observer.disconnect();
  }, [members, editable, showPayrollColumns, splitByShift]);

  function syncScrollFromTop(event: React.UIEvent<HTMLDivElement>) {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  }

  function syncScrollFromTable(event: React.UIEvent<HTMLDivElement>) {
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
        <div className="bg-slate-800 px-4 py-2.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              {subtitle && <p className="mt-0.5 text-xs text-slate-300">{subtitle}</p>}
            </div>
            {headerToolbar && (
              <div className="flex flex-wrap items-center gap-2">{headerToolbar}</div>
            )}
          </div>
        </div>

        <div
          ref={topScrollRef}
          onScroll={syncScrollFromTop}
          className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50"
          aria-hidden
        >
          <div style={{ width: tableScrollWidth, height: 12 }} />
        </div>

        <div ref={tableScrollRef} onScroll={syncScrollFromTable} className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse">
            <colgroup>
              {editable && <col className="w-8" />}
              <col className="w-[8.5rem]" />
              <col className="w-[11rem]" />
            </colgroup>
            <thead>
              <tr>
                {editable && (
                  <th
                    className={`${headerCell} w-8 ${stickyHeaderRemoveClass()}`}
                    aria-label="Acciones"
                  />
                )}
                <th className={`${headerCell} text-left ${stickyHeaderNameClass(editable)}`}>
                  Nombre
                </th>
                <th className={`${headerCell} text-left ${stickyHeaderPositionClass(editable)}`}>
                  Puesto
                </th>
                {DAYS.map((day) => (
                  <th key={day} className={headerCell}>
                    {dayShort(day)}
                  </th>
                ))}
                <th className={headerCell}>Hs/Sem</th>
                {showPayrollColumns && (
                  <>
                    <th className={`${headerCell} text-right`}>Sueldo neto</th>
                    <th className={`${headerCell} text-right`}>CCSS</th>
                    <th className={`${headerCell} text-right`}>Sueldo bruto</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {splitByShift ? (
                <>
                  {fixedMembers.map((m) => {
                    const row = (
                      <MemberRow
                        key={m.id}
                        member={m}
                        rowIndex={memberRowIndex}
                        {...rowProps}
                      />
                    );
                    memberRowIndex += 1;
                    return row;
                  })}

                  <ShiftSectionHeader shift="am" count={amMembers.length} colSpan={colCount} />
                  {amMembers.map((m) => {
                    const row = (
                      <MemberRow
                        key={m.id}
                        member={m}
                        rowIndex={memberRowIndex}
                        {...rowProps}
                      />
                    );
                    memberRowIndex += 1;
                    return row;
                  })}
                  {amMembers.length === 0 && (
                    <EmptyShiftRow
                      colSpan={colCount}
                      shift="am"
                      editable={editable}
                      onEmptyShiftAction={onEmptyShiftAction}
                    />
                  )}
                  {showPayrollColumns && amMembers.length > 0 && (
                    <SubtotalRow
                      label="Turno AM"
                      members={amMembers}
                      payrollEntries={payrollEntries}
                      leadingColSpan={subtotalLeadingCols}
                    />
                  )}

                  <ShiftSectionHeader shift="pm" count={pmMembers.length} colSpan={colCount} />
                  {pmMembers.map((m) => {
                    const row = (
                      <MemberRow
                        key={m.id}
                        member={m}
                        rowIndex={memberRowIndex}
                        {...rowProps}
                      />
                    );
                    memberRowIndex += 1;
                    return row;
                  })}
                  {pmMembers.length === 0 && (
                    <EmptyShiftRow
                      colSpan={colCount}
                      shift="pm"
                      editable={editable}
                      onEmptyShiftAction={onEmptyShiftAction}
                    />
                  )}
                  {showPayrollColumns && pmMembers.length > 0 && (
                    <SubtotalRow
                      label="Turno PM"
                      members={pmMembers}
                      payrollEntries={payrollEntries}
                      leadingColSpan={subtotalLeadingCols}
                    />
                  )}
                </>
              ) : (
                sortedMembers.map((m) => {
                  const row = (
                    <MemberRow
                      key={m.id}
                      member={m}
                      rowIndex={memberRowIndex}
                      {...rowProps}
                    />
                  );
                  memberRowIndex += 1;
                  return row;
                })
              )}

              {showPayrollColumns && (
                <tr className="bg-violet-100 font-bold text-violet-950">
                  <td colSpan={subtotalLeadingCols} className={`${bodyCell} text-right`}>
                    TOTAL · {members.length} persona{members.length !== 1 ? "s" : ""}
                  </td>
                  <td className={`${bodyCell} text-right tabular-nums`}>
                    {formatCurrency(grandTotals.net)}
                  </td>
                  <td className={`${bodyCell} text-right tabular-nums`}>
                    {formatCurrency(grandTotals.ccss)}
                  </td>
                  <td className={`${bodyCell} text-right tabular-nums`}>
                    {formatCurrency(grandTotals.total)}
                  </td>
                </tr>
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

      <ConfirmDialog
        open={pendingRemoveId !== null}
        title="Quitar persona de la plantilla"
        description={
          pendingMember
            ? (() => {
                const positionLabel = getPositionLabel(
                  resolveMemberPosition(pendingMember),
                );
                const name = pendingMember.name.trim();
                return name
                  ? `¿Quitar a ${name} (${positionLabel})? Esta acción no se puede deshacer.`
                  : `¿Quitar al puesto ${positionLabel}? Esta acción no se puede deshacer.`;
              })()
            : "¿Quitar a esta persona de la plantilla?"
        }
        confirmLabel="Quitar"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoveId(null)}
      />
    </>
  );
}
