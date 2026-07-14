import { useManualSync, useSyncStatus } from '@/features/synchronization/hooks/use-sync';
import { AppButton } from '@/shared/components/app-button';
import { LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { ScrollView, StyleSheet, Text } from 'react-native';
export default function SyncScreen() {
  const { colors } = useAppTheme(),
    status = useSyncStatus(),
    sync = useManualSync();
  if (status.isLoading) return <LoadingState />;
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={s.screen}>
      <Text style={[s.title, { color: colors.text }]}>Đồng bộ offline</Text>
      <Text style={{ color: colors.textMuted }}>
        Adapter hiện tại là mock local dành cho development và kiểm thử.
      </Text>
      <Text style={{ color: colors.text }}>Đang chờ: {status.data?.pending ?? 0}</Text>
      <Text style={{ color: colors.text }}>Thất bại: {status.data?.failed ?? 0}</Text>
      <Text style={{ color: colors.text }}>
        Lần thành công:{' '}
        {status.data?.lastSuccessfulAt
          ? new Date(status.data.lastSuccessfulAt).toLocaleString()
          : 'Chưa có'}
      </Text>
      <AppButton
        label={sync.isPending ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
        disabled={sync.isPending}
        onPress={() => sync.mutate()}
      />
      {sync.data ? (
        <Text style={{ color: colors.primary }}>
          Đã đẩy {sync.data.pushed}, nhận {sync.data.pulled}.
        </Text>
      ) : null}
      {sync.error ? <Text style={{ color: colors.danger }}>{sync.error.message}</Text> : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
});
