type QueryLoadingState = {
  isPending: boolean;
  fetchStatus: "fetching" | "paused" | "idle";
};

export function isDashboardLoading(dashboard: QueryLoadingState, programs: QueryLoadingState) {
  return [dashboard, programs].some((query) => query.isPending && query.fetchStatus !== "paused");
}
