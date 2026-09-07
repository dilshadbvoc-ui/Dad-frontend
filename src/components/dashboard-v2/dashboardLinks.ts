import type { DateRangeValue } from "./DateRangeDropdown";

/**
 * Builds a link from a Dashboard II card/tile to a detail/report page that carries
 * the dashboard's currently selected branch + date range along as query params, so
 * the destination page opens already filtered to match what was showing on the
 * dashboard instead of resetting to its own defaults.
 *
 * Every DateRangeDropdown preset resolves to concrete startDate/endDate (see
 * resolvePreset in DateRangeDropdown.tsx) except "allTime", which means "no filter" —
 * so it's safe to always forward startDate/endDate verbatim rather than the internal
 * `period` keyword, which destination pages don't share a vocabulary for.
 */
export function withDashboardFilters(
  path: string,
  options: { range?: DateRangeValue; branchId?: string; extraParams?: Record<string, string> } = {}
): string {
  const { range, branchId, extraParams } = options;
  const params = new URLSearchParams(extraParams);

  if (branchId) params.set("branchId", branchId);
  if (range && range.period !== "allTime" && range.startDate && range.endDate) {
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
