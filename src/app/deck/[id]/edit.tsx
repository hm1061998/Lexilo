import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { DeckForm } from '@/features/decks/components/deck-form';
import { useDeckDetailQuery, useUpdateDeckMutation } from '@/features/decks/hooks/use-decks';
import type { DeckFormValues } from '@/features/decks/schemas/deck-form-schema';
import { ErrorState, LoadingState } from '@/shared/components/query-state';
import { useTagsQuery } from '@/features/tags/hooks/use-tags';

export default function EditDeckScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const query = useDeckDetailQuery(id);
  const tags = useTagsQuery();
  const mutation = useUpdateDeckMutation(id);
  if (query.isLoading || tags.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const deck = query.data;
  const submit = (values: DeckFormValues) =>
    mutation.mutate(values, {
      onSuccess: () => {
        Alert.alert('Đã cập nhật');
        router.back();
      },
      onError: () => Alert.alert('Không thể cập nhật'),
    });
  return (
    <DeckForm
      defaultValues={{
        name: deck.name,
        description: deck.description ?? '',
        languageFrom: deck.languageFrom,
        languageTo: deck.languageTo,
        isFavorite: deck.isFavorite,
        tagIds: tags.data?.filter((tag) => deck.tags.includes(tag.name)).map((tag) => tag.id) ?? [],
      }}
      isSubmitting={mutation.isPending}
      onSubmit={submit}
    />
  );
}
