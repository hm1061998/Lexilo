import { router } from 'expo-router';
import { Alert } from 'react-native';
import { DeckForm } from '@/features/decks/components/deck-form';
import { useCreateDeckMutation } from '@/features/decks/hooks/use-decks';
import type { DeckFormValues } from '@/features/decks/schemas/deck-form-schema';

export default function CreateDeckScreen() {
  const mutation = useCreateDeckMutation();
  const submit = (values: DeckFormValues) =>
    mutation.mutate(values, {
      onSuccess: (deck) => {
        Alert.alert('Đã tạo bộ thẻ');
        router.replace({ pathname: '/deck/[id]', params: { id: deck.id } });
      },
      onError: () => Alert.alert('Không thể lưu', 'Vui lòng kiểm tra dữ liệu và thử lại.'),
    });
  return <DeckForm isSubmitting={mutation.isPending} onSubmit={submit} />;
}
