import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"

/**
 * Org-wide unfiltered count for a list page's "Showing X of Y" indicator.
 * Backed by that entity's list controller `?countOnly=true` short-circuit
 * (same org/visibility scoping as the full list, none of the page's own
 * query filters, no findMany) — cheap enough to fire alongside the page's
 * normal filtered query. Long staleTime since the org-wide default total
 * changes far less often than a page's filters do.
 */
export function useEntityTotalCount(entity: string, path: string) {
  const { data } = useQuery({
    queryKey: [entity, "total-count"],
    queryFn: async () => {
      const response = await api.get(path, { params: { countOnly: true } })
      return response.data?.total as number
    },
    staleTime: 5 * 60 * 1000,
  })
  return data
}
