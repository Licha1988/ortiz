"use client";

import CollapsibleSection from "@/components/ui/CollapsibleSection";
import PageLayout from "@/components/ui/PageLayout";
import Dashboard from "@/components/Dashboard";
import OperationalMonthBar from "@/components/OperationalMonthBar";
import StaffingDashboard from "@/components/StaffingDashboard";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import type { PayrollEntry } from "@/lib/payroll/types";
import type { StaffingParams } from "@/lib/staffing/params";
import type { StaffMember } from "@/lib/staffing/types";
import type { DashboardParams } from "@/lib/types";

type HubSection = "facturacion" | "rrhh";

const HUB_COLLAPSIBLE_DEFAULTS: Record<HubSection, boolean> = {
  facturacion: false,
  rrhh: false,
};

const HUB_COLLAPSIBLE_STORAGE_KEY = "casa-ortiz:operational-hub";

type OperationalHubProps = {
  params: DashboardParams;
  setParams: React.Dispatch<React.SetStateAction<DashboardParams>>;
  monthlyRevenue: number;
  payrollEntries: PayrollEntry[];
  setPayrollEntries: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
  staffingParams: StaffingParams;
  setStaffingParams: React.Dispatch<React.SetStateAction<StaffingParams>>;
  managerTeam: StaffMember[];
  setManagerTeam: React.Dispatch<React.SetStateAction<StaffMember[]>>;
};

export default function OperationalHub({
  params,
  setParams,
  monthlyRevenue,
  payrollEntries,
  setPayrollEntries,
  staffingParams,
  setStaffingParams,
  managerTeam,
  setManagerTeam,
}: OperationalHubProps) {
  const [open, setOpen] = usePersistentState<Record<HubSection, boolean>>(
    HUB_COLLAPSIBLE_STORAGE_KEY,
    HUB_COLLAPSIBLE_DEFAULTS,
  );

  const toggle = (id: string) => {
    const key = id as HubSection;
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PageLayout width="narrow" className="space-y-4">
      <OperationalMonthBar />

      <CollapsibleSection
        id="facturacion"
        title="Facturación y cubiertos"
        subtitle="Parámetros, objetivos, cumplimiento y calendario"
        open={open.facturacion}
        onToggle={toggle}
      >
        <Dashboard embedded params={params} setParams={setParams} />
      </CollapsibleSection>

      <CollapsibleSection
        id="rrhh"
        title="Recurso humano"
        subtitle="Plantilla, nómina, cobertura y horarios rush"
        open={open.rrhh}
        onToggle={toggle}
      >
        <StaffingDashboard
          embedded
          params={params}
          setParams={setParams}
          monthlyRevenue={monthlyRevenue}
          staffingParams={staffingParams}
          setStaffingParams={setStaffingParams}
          payrollEntries={payrollEntries}
          setPayrollEntries={setPayrollEntries}
          managerTeam={managerTeam}
          setManagerTeam={setManagerTeam}
        />
      </CollapsibleSection>
    </PageLayout>
  );
}
