import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDecksQuery } from '@/features/decks/hooks/use-decks';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';

export default function DecksScreen() {
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<'updatedAt' | 'createdAt' | 'name'>('updatedAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const query = useDecksQuery({
    search: useDebouncedValue(search),
    sortBy: sort,
    sortDirection: direction,
    limit,
  });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.toolbar}>
        <TextInput
          accessibilityLabel="Tìm bộ thẻ"
          placeholder="Tìm bộ thẻ…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[
            styles.search,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
        <View style={styles.sortRow}>
          {(
            [
              ['updatedAt', 'desc', 'Cập nhật'],
              ['createdAt', 'desc', 'Mới tạo'],
              ['name', 'asc', 'A–Z'],
              ['name', 'desc', 'Z–A'],
            ] as const
          ).map(([item, itemDirection, label]) => (
            <Pressable
              key={`${item}-${itemDirection}`}
              onPress={() => {
                setSort(item);
                setDirection(itemDirection);
              }}
            >
              <Text
                style={{
                  color:
                    sort === item && direction === itemDirection
                      ? colors.primary
                      : colors.textMuted,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={query.data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Bạn chưa có bộ flashcard nào."
            description="Hãy tạo bộ đầu tiên để bắt đầu học."
          />
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: '/deck/[id]', params: { id: item.id } }} asChild>
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
                <Text>{item.isFavorite ? '★' : ''}</Text>
              </View>
              <Text numberOfLines={2} style={{ color: colors.textMuted }}>
                {item.description || 'Không có mô tả'}
              </Text>
              <Text style={{ color: colors.textMuted }}>
                {item.cardCount} flashcard · {item.tags.join(', ')}
              </Text>
            </Pressable>
          </Link>
        )}
        onEndReached={() => {
          if ((query.data?.length ?? 0) >= limit) setLimit((value) => value + 20);
        }}
        onEndReachedThreshold={0.3}
      />
      <Link href="/deck/create" asChild>
        <Pressable
          accessibilityLabel="Thêm bộ thẻ"
          style={[styles.fab, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.fabText, { color: colors.background }]}>＋</Text>
        </Pressable>
      </Link>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  toolbar: { padding: 16, gap: 12 },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  sortRow: { flexDirection: 'row', gap: 20 },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { fontSize: 28 },
});
