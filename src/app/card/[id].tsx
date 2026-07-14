import { useCardDetailQuery, useDeleteCardMutation } from '@/features/cards/hooks/use-cards';
import { ErrorState, LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Link, router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CardDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const query = useCardDetailQuery(id);
  const remove = useDeleteCardMutation();
  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const card = query.data;
  const speak = async () => {
    try {
      const available = await Speech.isSpeakingAsync();
      if (available) Speech.stop();
      Speech.speak(card.frontText, { language: 'en-US' });
    } catch {
      Alert.alert('Không thể phát âm', 'Thiết bị hiện không hỗ trợ chức năng này.');
    }
  };
  const confirmDelete = () =>
    Alert.alert(
      'Xóa flashcard này?',
      'Tiến độ học liên quan sẽ được giữ lại để hỗ trợ đồng bộ và khôi phục dữ liệu.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => remove.mutate(id, { onSuccess: () => router.back() }),
        },
      ],
    );
  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <Text style={[styles.word, { color: colors.text }]}>{card.frontText}</Text>
      <Text style={[styles.meaning, { color: colors.primary }]}>{card.backText}</Text>
      <Text style={{ color: colors.textMuted }}>
        {card.phonetic} · {card.partOfSpeech}
      </Text>
      <Section label="Ví dụ" value={card.exampleText} />
      <Section label="Dịch" value={card.exampleTranslation} />
      <Section label="Đồng nghĩa" value={card.synonyms.join(', ')} />
      <Section label="Trái nghĩa" value={card.antonyms.join(', ')} />
      <Section label="Ghi chú" value={card.note} />
      <Text style={{ color: colors.textMuted }}>
        Độ khó: {card.difficulty} · Tags: {card.tags.join(', ')}
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={speak}>
          <Text style={{ color: colors.primary }}>Phát âm</Text>
        </Pressable>
        <Link href={{ pathname: '/card/[id]/edit', params: { id } }} asChild>
          <Pressable>
            <Text style={{ color: colors.primary }}>Chỉnh sửa</Text>
          </Pressable>
        </Link>
        <Pressable onPress={confirmDelete}>
          <Text style={{ color: colors.danger }}>Xóa</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
  function Section({ label, value }: { label: string; value: string | null }) {
    if (!value) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={{ color: colors.textMuted }}>{value}</Text>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 22, gap: 13 },
  word: { fontSize: 34, fontWeight: '800' },
  meaning: { fontSize: 22, fontWeight: '700' },
  section: { gap: 5 },
  label: { fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 22, marginTop: 16 },
});
