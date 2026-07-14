import {
  useReminderSettings,
  useSaveReminder,
} from '@/features/notifications/hooks/use-notifications';
import { AppButton } from '@/shared/components/app-button';
import { AppInput } from '@/shared/components/app-input';
import { ErrorState, LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
export default function NotificationsScreen() {
  const q = useReminderSettings();
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <ErrorState onRetry={() => q.refetch()} />;
  return <Form initial={q.data} />;
}
function Form({
  initial,
}: {
  initial: NonNullable<ReturnType<typeof useReminderSettings>['data']>;
}) {
  const { colors } = useAppTheme(),
    save = useSaveReminder();
  const [enabled, setEnabled] = useState(initial.enabled),
    [hour, setHour] = useState(String(initial.reminderHour)),
    [minute, setMinute] = useState(String(initial.reminderMinute));
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={s.screen}>
      <Text style={[s.title, { color: colors.text }]}>Nhắc học</Text>
      <Text style={{ color: colors.textMuted }}>
        Lexilo chỉ xin quyền khi bạn bật tính năng này.
      </Text>
      <View style={s.row}>
        <Text style={{ color: colors.text }}>Bật nhắc học hằng ngày</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
      <AppInput label="Giờ (0–23)" keyboardType="number-pad" value={hour} onChangeText={setHour} />
      <AppInput
        label="Phút (0–59)"
        keyboardType="number-pad"
        value={minute}
        onChangeText={setMinute}
      />
      <AppButton
        label="Lưu và lên lịch"
        onPress={() =>
          save.mutate({
            ...initial,
            enabled,
            reminderHour: Number(hour),
            reminderMinute: Number(minute),
          })
        }
      />
      {save.error ? <Text style={{ color: colors.danger }}>{save.error.message}</Text> : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
