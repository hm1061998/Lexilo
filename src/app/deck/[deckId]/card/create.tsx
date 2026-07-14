import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { CardForm } from '@/features/cards/components/card-form';
import { useCreateCardMutation } from '@/features/cards/hooks/use-cards';
import type { CardFormValues } from '@/features/cards/schemas/card-form-schema';
import { useRepositories } from '@/database/repositories/use-repositories';
import { parseCommaSeparatedValues } from '@/shared/utils/strings';

export default function CreateCardScreen() {
  const { deckId = '' } = useLocalSearchParams<{ deckId: string }>();
  const mutation = useCreateCardMutation();
  const { cards } = useRepositories();
  const save = (values: CardFormValues) => {
    const input = {
      deckId,
      ...values,
      synonyms: parseCommaSeparatedValues(values.synonymsText),
      antonyms: parseCommaSeparatedValues(values.antonymsText),
    };
    mutation.mutate(input, {
      onSuccess: () => {
        Alert.alert('Đã tạo flashcard');
        router.back();
      },
      onError: () => Alert.alert('Không thể lưu flashcard'),
    });
  };
  const submit = async (values: CardFormValues) => {
    const exists = await cards.existsByFrontText(deckId, values.frontText);
    if (exists) {
      Alert.alert('Từ đã tồn tại', 'Bạn vẫn muốn tạo thêm?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Vẫn tạo', onPress: () => save(values) },
      ]);
    } else save(values);
  };
  return <CardForm isSubmitting={mutation.isPending} onSubmit={submit} />;
}
