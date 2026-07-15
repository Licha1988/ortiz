import { createStaffMember } from "./schedules";
import type { StaffMember, StaffRoleType } from "./types";

export function createDefaultManagerTeam(): StaffMember[] {
  const roster: Array<{
    role: StaffRoleType;
    count: number;
    names: string[];
  }> = [
    // FOH
    { role: "GER",  count: 1, names: ["Laura M."] },
    { role: "ENC",  count: 1, names: ["Diego P."] },
    { role: "CAJ_PM", count: 1, names: ["Mariana T."] },
    { role: "CAM",  count: 4, names: ["Lucía G.", "Martín V.", "Carla N.", "Tomás B."] },
    { role: "CR",   count: 2, names: ["Ana R.", "Pablo S."] },
    { role: "CE",   count: 2, names: ["Refuerzo 1", "Refuerzo 2"] },
    { role: "BC",   count: 2, names: ["Sofía L.", "Bruno H."] },
    // BOH fijos
    { role: "LIS",          count: 1, names: ["Lisandro"] },
    { role: "BRUNO",        count: 1, names: ["Bruno Bonnano"] },
    { role: "JEFE_COC_AM",  count: 1, names: ["Jefe Cocina AM"] },
    { role: "JEFE_COC_PM",  count: 1, names: ["Jefe Cocina PM"] },
    // BOH AM
    { role: "PAR_AM",  count: 1, names: ["Jefe de pastelería AM"] },
    { role: "FUE_AM",  count: 1, names: ["Cocinero AM"] },
    // BOH PM
    { role: "PAR_PM",  count: 1, names: ["Ayudante PM Pastelería"] },
    { role: "FUE_PM",  count: 1, names: ["Ayudante PM Fuegos"] },
    { role: "GUAR_PM", count: 1, names: ["Ayudante PM Guarniciones"] },
    { role: "FREI_PM", count: 1, names: ["Ayudante PM Freidora"] },
    { role: "BACH_PM", count: 1, names: ["Bacha PM"] },
  ];

  return roster.flatMap(({ role, count, names }) =>
    Array.from({ length: count }, (_, index) =>
      createStaffMember(role, index, names[index] ?? ""),
    ),
  );
}
