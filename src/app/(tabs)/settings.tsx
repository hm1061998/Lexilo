import { useGoalsQuery, useUpdateGoalsMutation } from '@/features/statistics/hooks/use-statistics';
import type { LearningGoals } from '@/features/statistics/types/statistics.types';
import { AppButton } from '@/shared/components/app-button';
import { AppInput } from '@/shared/components/app-input';
import { ErrorState, LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const query = useGoalsQuery();
  if (query.isLoading) return <LoadingState />;
  if (!query.data) return <ErrorState onRetry={() => query.refetch()} />;
  return <GoalsForm key={query.data.updatedAt} goals={query.data} />;
}
function GoalsForm({ goals }: { goals: LearningGoals }) {
  const { colors } = useAppTheme();
  const save = useUpdateGoalsMutation();
  const [values, setValues] = useState({
    dailyCardGoal: String(goals.dailyCardGoal),
    dailyMinutesGoal: String(goals.dailyMinutesGoal),
    weeklyDaysGoal: String(goals.weeklyDaysGoal),
    dailyNewCardsGoal: String(goals.dailyNewCardsGoal),
    dailyReviewCardsGoal: String(goals.dailyReviewCardsGoal),
  });
  const field = (key: keyof typeof values, label: string) => (
    <AppInput
      label={label}
      keyboardType="number-pad"
      value={values[key]}
      onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
    />
  );
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.screen}
    >
      <Text style={[styles.title, { color: colors.text }]}>Cài đặt</Text>
      <View style={styles.links}>
        <SettingsLink href="/settings/notifications" label="Thông báo nhắc học" />
        <SettingsLink href="/settings/backup" label="Sao lưu dữ liệu" />
        <SettingsLink href="/settings/synchronization" label="Đồng bộ offline" />
      </View>
      <Text style={[styles.heading, { color: colors.text }]}>Mục tiêu học tập</Text>
      {field('dailyCardGoal', 'Số thẻ mỗi ngày')}
      {field('dailyMinutesGoal', 'Số phút mỗi ngày')}
      {field('weeklyDaysGoal', 'Số ngày mỗi tuần (1–7)')}
      {field('dailyNewCardsGoal', 'Thẻ mới mỗi ngày')}
      {field('dailyReviewCardsGoal', 'Thẻ ôn mỗi ngày')}
      <AppButton
        label={save.isPending ? 'Đang lưu…' : 'Lưu mục tiêu'}
        disabled={save.isPending}
        onPress={() =>
          save.mutate({
            dailyCardGoal: Number(values.dailyCardGoal),
            dailyMinutesGoal: Number(values.dailyMinutesGoal),
            weeklyDaysGoal: Number(values.weeklyDaysGoal),
            dailyNewCardsGoal: Number(values.dailyNewCardsGoal),
            dailyReviewCardsGoal: Number(values.dailyReviewCardsGoal),
          })
        }
      />
    </ScrollView>
  );
}
function SettingsLink({
  href,
  label,
}: {
  href: '/settings/notifications' | '/settings/backup' | '/settings/synchronization';
  label: string;
}) {
  return (
    <Link href={href} asChild>
      <View>
        <AppButton label={label} />
      </View>
    </Link>
  );
}
const styles = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  heading: { fontSize: 20, fontWeight: '700' },
  links: { gap: 10 },
});
