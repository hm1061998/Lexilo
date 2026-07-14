import { parseCardCsv, type CsvPreview } from '@/features/import-export/csv-parser';
import { importCsvRows, type DuplicateStrategy } from '@/features/import-export/import-service';
import { queryKeys } from '@/services/query/query-keys';
import { AppButton } from '@/shared/components/app-button';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ImportCsvScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const database = useSQLiteContext();
  const client = useQueryClient();
  const { colors } = useAppTheme();
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');
  const [loading, setLoading] = useState(false);
  const choose = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      const file = new File(asset.uri);
      setPreview(parseCardCsv(await file.text(), asset.size ?? file.size ?? 0));
    } catch {
      Alert.alert('File không hợp lệ', 'Hãy kiểm tra định dạng, kích thước và header CSV.');
    }
  };
  const run = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const result = await importCsvRows(database, id, preview.validRows, strategy);
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.cards.all }),
        client.invalidateQueries({ queryKey: queryKeys.decks.detail(id) }),
      ]);
      Alert.alert(
        'Import hoàn tất',
        `${result.imported} dòng đã nhập, ${result.skipped} dòng bỏ qua.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('Không thể import', 'Không có dữ liệu nào được ghi.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Import CSV</Text>
      <AppButton label="Chọn file CSV" variant="secondary" onPress={choose} />
      {preview ? (
        <>
          <Text style={{ color: colors.text }}>
            Tổng {preview.totalRows} · Hợp lệ {preview.validRows.length} · Lỗi{' '}
            {preview.errors.length}
          </Text>
          {preview.errors.slice(0, 20).map((error) => (
            <Text key={error.row} style={{ color: colors.danger }}>
              Dòng {error.row}: {error.message}
            </Text>
          ))}
          <Text style={{ color: colors.text }}>Xử lý từ trùng:</Text>
          <View style={styles.row}>
            {(['skip', 'create', 'update'] as const).map((item) => (
              <AppButton
                key={item}
                label={item === 'skip' ? 'Bỏ qua' : item === 'create' ? 'Vẫn tạo' : 'Cập nhật'}
                variant={strategy === item ? 'primary' : 'secondary'}
                onPress={() => setStrategy(item)}
              />
            ))}
          </View>
          <AppButton
            label="Import dòng hợp lệ"
            loading={loading}
            disabled={!preview.validRows.length}
            onPress={run}
          />
        </>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, gap: 14 },
  title: { fontSize: 26, fontWeight: '800' },
  row: { gap: 8 },
});
