import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/database/repositories/use-repositories';
import { queryKeys } from '@/services/query/query-keys';
import type { CreateDeckInput, FindDeckOptions, UpdateDeckInput } from '../types/deck';

export function useDecksQuery(options: FindDeckOptions) {
  const { decks } = useRepositories();
  return useQuery({
    queryKey: queryKeys.decks.list(options),
    queryFn: () => decks.findAll(options),
  });
}
export function useDeckDetailQuery(id: string) {
  const { decks } = useRepositories();
  return useQuery({
    queryKey: queryKeys.decks.detail(id),
    queryFn: () => decks.findById(id),
    enabled: Boolean(id),
  });
}
export function useDeckStatisticsQuery(id: string) {
  const { decks } = useRepositories();
  return useQuery({
    queryKey: queryKeys.decks.statistics(id),
    queryFn: () => decks.getStatistics(id),
    enabled: Boolean(id),
  });
}
export function useCreateDeckMutation() {
  const { decks } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeckInput) => decks.create(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.decks.all }),
  });
}
export function useUpdateDeckMutation(id: string) {
  const { decks } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDeckInput) => decks.update(id, input),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.decks.all }),
        client.invalidateQueries({ queryKey: queryKeys.decks.detail(id) }),
      ]),
  });
}
export function useDeleteDeckMutation() {
  const { decks } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => decks.softDelete(id),
    onSuccess: (_, id) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.decks.all }),
        client.removeQueries({ queryKey: queryKeys.decks.detail(id) }),
      ]),
  });
}
export function useDuplicateDeckMutation() {
  const { decks } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => decks.duplicate(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.decks.all }),
  });
}
