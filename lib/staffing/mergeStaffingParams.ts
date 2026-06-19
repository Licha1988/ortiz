import { DEFAULT_STAFFING_PARAMS, type StaffingParamKey, type StaffingParams } from "@/lib/staffing/params";

export function cloneStaffingParams(
  params: StaffingParams = DEFAULT_STAFFING_PARAMS,
): StaffingParams {
  return { ...params };
}

export function mergeStaffingParams(stored?: Partial<StaffingParams>): StaffingParams {
  const base = cloneStaffingParams(DEFAULT_STAFFING_PARAMS);
  if (!stored) {
    return base;
  }

  const merged = { ...base };
  for (const key of Object.keys(base) as StaffingParamKey[]) {
    const value = stored[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      merged[key] = value;
    }
  }
  return merged;
}
