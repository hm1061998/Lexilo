import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDecksQuery } from '@/features/decks/hooks/use-decks';
import { useCreateStudySessionMutation } from '@/features/study/hooks/use-study';
import type { StudyMode, StudyScope } from '@/features/study/types/study.types';
import { AppButton } from '@/shared/components/app-button';
import { LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';
export default function StudySetupScreen() {
  const params = useLocalSearchParams<{ deckId?: string }>();
  const { colors } = useAppTheme();
  const decks = useDecksQuery({ limit: 100, sortBy: 'name', sortDirection: 'asc' });
  const [start, setStart] = useState(params.deckId ? [params.deckId] : ([] as string[]));
  const [mode, setMode] = useState<StudyMode>('flashcard');
  const [scope, setScope] = useState<StudyScope>('mixed');
  const [limit, setLimit] = useState(20);
  const [shuffle, setShuffle] = useState(true);
  const mutation = useCreateStudySessionMutation();
  if (decks.isLoading) return <LoadingState />;
  const begin = () =>
    mutation.mutate(
      {
        deckIds: start,
        mode,
        scope,
        cardLimit: limit,
        newCardLimit: 10,
        reviewCardLimit: 20,
        shuffle,
        autoPlayAudio: false,
        includeMastered: false,
      },
      {
        onSuccess: (session) =>
          router.replace({ pathname: '/study/session', params: { id: session.id } }),
        onError: (error) => Alert.alert('Không thể bắt đầu', error.message),
      },
    );
  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Thiết lập phiên học</Text>
      <Text style={[styles.label, { color: colors.text }]}>Chọn bộ thẻ</Text>
      {decks.data?.map((deck) => (
        <Pressable
          key={deck.id}
          onPress={() =>
            setStart((value) =>
              value.includes(deck.id) ? value.filter((id) => id !== deck.id) : [...value, deck.id],
            )
          }
          style={[
            styles.choice,
            {
              borderColor: start.includes(deck.id) ? colors.primary : colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text style={{ color: colors.text }}>
            {deck.name} ({deck.cardCount})
          </Text>
        </Pressable>
      ))}
      <Selector
        label="Chế độ"
        values={[
          ['flashcard', 'Flashcard'],
          ['multiple_choice', 'Trắc nghiệm'],
          ['typing', 'Gõ đáp án'],
        ]}
        selected={mode}
        onSelect={(value) => setMode(value as StudyMode)}
      />
      <Selector
        label="Phạm vi"
        values={[
          ['mixed', 'Kết hợp'],
          ['due', 'Đến hạn'],
          ['new', 'Thẻ mới'],
          ['all', 'Tất cả'],
        ]}
        selected={scope}
        onSelect={(value) => setScope(value as StudyScope)}
      />
      <Text style={[styles.label, { color: colors.text }]}>Số thẻ (1–100)</Text>
      <TextInput
        value={String(limit)}
        onChangeText={(value) => setLimit(Math.min(100, Math.max(1, Number(value) || 1)))}
        keyboardType="number-pad"
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      />
      <View style={styles.switch}>
        <Text style={{ color: colors.text }}>Trộn thứ tự</Text>
        <Switch value={shuffle} onValueChange={setShuffle} />
      </View>
      <AppButton
        label="Bắt đầu học"
        loading={mutation.isPending}
        disabled={!start.length}
        onPress={begin}
      />
    </ScrollView>
  );
  function Selector({
    label,
    values,
    selected,
    onSelect,
  }: {
    label: string;
    values: readonly (readonly [string, string])[];
    selected: string;
    onSelect: (v: string) => void;
  }) {
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <View style={styles.row}>
          {values.map(([value, text]) => (
            <Pressable
              key={value}
              onPress={() => onSelect(value)}
              style={[
                styles.pill,
                {
                  borderColor: selected === value ? colors.primary : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  title: { fontSize: 28, fontWeight: '800' },
  label: { fontWeight: '700' },
  choice: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 14 },
  section: { gap: 9 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  switch: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
