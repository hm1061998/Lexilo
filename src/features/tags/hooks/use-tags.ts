import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/database/repositories/use-repositories';
import { queryKeys } from '@/services/query/query-keys';

export function useTagsQuery(search?: string) {
  const { tags } = useRepositories();
  return useQuery({ queryKey: queryKeys.tags.list(search), queryFn: () => tags.findAll(search) });
}
export function useCreateTagMutation() {
  const { tags } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string | null }) =>
      tags.create(name, color),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tags.all }),
  });
}
export function useUpdateTagMutation() {
  const { tags } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; color?: string | null } }) =>
      tags.update(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tags.all }),
  });
}
export function useDeleteTagMutation() {
  const { tags } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tags.delete(id),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.tags.all }),
        client.invalidateQueries({ queryKey: queryKeys.decks.all }),
        client.invalidateQueries({ queryKey: queryKeys.cards.all }),
      ]),
  });
}
