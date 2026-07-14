import { useRepositories } from '@/database/repositories/use-repositories';
import { useCardsQuery } from '@/features/cards/hooks/use-cards';
import {
  useDeckDetailQuery,
  useDeleteDeckMutation,
  useDuplicateDeckMutation,
} from '@/features/decks/hooks/use-decks';
import { exportDeckJson } from '@/features/import-export/export-service';
import { AppButton } from '@/shared/components/app-button';
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/query-state';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DeckDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const deck = useDeckDetailQuery(id);
  const cards = useCardsQuery({ deckId: id, search: useDebouncedValue(search), limit: 50 });
  const remove = useDeleteDeckMutation();
  const duplicate = useDuplicateDeckMutation();
  const repositories = useRepositories();
  if (deck.isLoading) return <LoadingState />;
  if (deck.isError) return <ErrorState onRetry={() => deck.refetch()} />;
  if (!deck.data)
    return <EmptyState title="Không tìm thấy bộ thẻ" description="Bộ thẻ có thể đã bị xóa." />;
  const item = deck.data;
  const confirmDelete = () =>
    Alert.alert(
      'Xóa bộ thẻ này?',
      'Các flashcard trong bộ thẻ sẽ không còn xuất hiện trong ứng dụng.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => remove.mutate(id, { onSuccess: () => router.replace('/(tabs)/decks') }),
        },
      ],
    );
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 18) }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại danh sách bộ thẻ"
            hitSlop={10}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/decks'))}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
          </Pressable>
          <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>
            {item.name}
          </Text>
        </View>
        <Text style={{ color: colors.textMuted }}>{item.description}</Text>
        <Text style={{ color: colors.textMuted }}>
          {item.languageFrom} → {item.languageTo} · {item.cardCount} thẻ
        </Text>
        <View style={styles.actions}>
          <Link href={{ pathname: '/deck/[id]/edit', params: { id } }} asChild>
            <Pressable>
              <Text style={{ color: colors.primary }}>Sửa</Text>
            </Pressable>
          </Link>
          <Pressable
            onPress={() =>
              duplicate.mutate(id, {
                onSuccess: (copy) =>
                  router.push({ pathname: '/deck/[id]', params: { id: copy.id } }),
              })
            }
          >
            <Text style={{ color: colors.primary }}>Sao chép</Text>
          </Pressable>
          <Link href={{ pathname: '/deck/[id]/import', params: { id } }} asChild>
            <Pressable>
              <Text style={{ color: colors.primary }}>Import</Text>
            </Pressable>
          </Link>
          <Pressable
            onPress={() =>
              exportDeckJson(repositories.decks, repositories.cards, id).catch(() =>
                Alert.alert('Không thể export'),
              )
            }
          >
            <Text style={{ color: colors.primary }}>Export</Text>
          </Pressable>
          <Pressable onPress={confirmDelete}>
            <Text style={{ color: colors.danger }}>Xóa</Text>
          </Pressable>
        </View>
        <TextInput
          placeholder="Tìm flashcard…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[
            styles.search,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />
      </View>
      {cards.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={cards.data}
          keyExtractor={(card) => card.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="Bộ thẻ này chưa có flashcard."
              description="Hãy thêm từ đầu tiên hoặc import từ CSV."
            />
          }
          renderItem={({ item: card }) => (
            <Link href={{ pathname: '/card/[id]', params: { id: card.id } }} asChild>
              <Pressable
                style={StyleSheet.flatten([
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ])}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>{card.frontText}</Text>
                <Text numberOfLines={2} style={{ color: colors.textMuted }}>
                  {card.backText}
                </Text>
                <Text style={{ color: colors.textMuted }}>
                  {card.phonetic} · Độ khó {card.difficulty}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
      <View style={[styles.add, { bottom: Math.max(insets.bottom, 20) }]}>
        <AppButton
          label="Học bộ thẻ"
          onPress={() => router.push({ pathname: '/study/setup', params: { deckId: id } })}
        />
        <AppButton
          label="Thêm flashcard"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/deck/[deckId]/card/create', params: { deckId: id } })
          }
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 18, gap: 9 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 32, lineHeight: 34, marginTop: -2 },
  title: { fontSize: 26, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 20, marginVertical: 8 },
  search: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  list: { padding: 16, gap: 10, paddingBottom: 145 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 5 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  add: { position: 'absolute', left: 20, right: 20, bottom: 20, gap: 8 },
});
