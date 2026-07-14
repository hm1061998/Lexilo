import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '@/database/repositories/use-repositories';
import { queryKeys } from '@/services/query/query-keys';
import type { CreateCardInput, FindCardOptions, UpdateCardInput } from '../types/card';

export function useCardsQuery(options: FindCardOptions) {
  const { cards } = useRepositories();
  return useQuery({
    queryKey: queryKeys.cards.list(options),
    queryFn: () => cards.findAll(options),
    enabled: Boolean(options.deckId),
  });
}
export function useCardDetailQuery(id: string) {
  const { cards } = useRepositories();
  return useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => cards.findById(id),
    enabled: Boolean(id),
  });
}
export function useCreateCardMutation() {
  const { cards } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) => cards.create(input),
    onSuccess: (card) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.cards.all }),
        client.invalidateQueries({ queryKey: queryKeys.decks.detail(card.deckId) }),
        client.invalidateQueries({ queryKey: queryKeys.decks.statistics(card.deckId) }),
      ]),
  });
}
export function useUpdateCardMutation(id: string) {
  const { cards } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCardInput) => cards.update(id, input),
    onSuccess: (card) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.cards.all }),
        client.invalidateQueries({ queryKey: queryKeys.cards.detail(id) }),
        client.invalidateQueries({ queryKey: queryKeys.decks.detail(card.deckId) }),
      ]),
  });
}
export function useDeleteCardMutation() {
  const { cards } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cards.softDelete(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.cards.all }),
  });
}
