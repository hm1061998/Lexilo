import { CardForm } from '@/features/cards/components/card-form';
import { useCardDetailQuery, useUpdateCardMutation } from '@/features/cards/hooks/use-cards';
import type { CardFormValues } from '@/features/cards/schemas/card-form-schema';
import { ErrorState, LoadingState } from '@/shared/components/query-state';
import { parseCommaSeparatedValues } from '@/shared/utils/strings';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

export default function EditCardScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const query = useCardDetailQuery(id);
  const mutation = useUpdateCardMutation(id);
  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const card = query.data;
  const submit = (values: CardFormValues) =>
    mutation.mutate(
      {
        ...values,
        synonyms: parseCommaSeparatedValues(values.synonymsText),
        antonyms: parseCommaSeparatedValues(values.antonymsText),
      },
      {
        onSuccess: () => {
          Alert.alert('Đã cập nhật');
          router.back();
        },
        onError: () => Alert.alert('Không thể cập nhật'),
      },
    );
  return (
    <CardForm
      defaultValues={{
        frontText: card.frontText,
        backText: card.backText,
        phonetic: card.phonetic ?? '',
        partOfSpeech: card.partOfSpeech ?? '',
        exampleText: card.exampleText ?? '',
        exampleTranslation: card.exampleTranslation ?? '',
        note: card.note ?? '',
        synonymsText: card.synonyms.join(', '),
        antonymsText: card.antonyms.join(', '),
        difficulty: card.difficulty,
      }}
      isSubmitting={mutation.isPending}
      onSubmit={submit}
    />
  );
}
