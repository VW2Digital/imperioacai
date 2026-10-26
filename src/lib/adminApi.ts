import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./http";
import { qk } from "./queries";

/**
 * Hooks genericos de CRUD para os recursos do admin
 * (/data/admin/{categories|products|banners|links}).
 */
export function useAdminList<T>(resource: string) {
  return useQuery({ queryKey: qk.admin(resource), queryFn: () => api<T[]>(`/data/admin/${resource}`) });
}

export function useAdminMutations<T extends { id: number }>(resource: string, publicKeys: readonly (readonly string[])[] = [qk.menu, qk.links]) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.admin(resource) });
    qc.invalidateQueries({ queryKey: qk.stats });
    publicKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };

  const create = useMutation({
    mutationFn: (data: object) => api<T>(`/data/admin/${resource}`, { method: "POST", body: data }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      api<T>(`/data/admin/${resource}/${id}`, { method: "PUT", body: data }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => api<void>(`/data/admin/${resource}/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (ids: number[]) => api<void>(`/data/admin/${resource}/reorder`, { method: "PUT", body: { ids } }),
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder };
}

/** Move o item de indice `from` para `to` e devolve a nova lista de ids. */
export function moveIds<T extends { id: number }>(list: T[], from: number, to: number): number[] {
  const ids = list.map((x) => x.id);
  if (to < 0 || to >= ids.length) return ids;
  const [item] = ids.splice(from, 1);
  ids.splice(to, 0, item);
  return ids;
}
