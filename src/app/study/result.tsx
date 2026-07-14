import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useStudyResultQuery } from '@/features/study/hooks/use-study';
import { AppButton } from '@/shared/components/app-button';
import { ErrorState, LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';
export default function StudyResultScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const query = useStudyResultQuery(id);
  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const { session, accuracy, wrongAnswers } = query.data;
  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Hoàn thành!</Text>
      <Text style={[styles.accuracy, { color: colors.primary }]}>{accuracy}% chính xác</Text>
      <Text style={{ color: colors.text }}>
        Đã học {session.answeredCards}/{session.totalCards} thẻ
      </Text>
      <Text style={{ color: colors.text }}>
        Đúng {session.correctAnswers} · Sai {session.incorrectAnswers}
      </Text>
      <Text style={{ color: colors.text }}>
        Thời gian {session.durationSeconds} giây · XP {session.earnedXp}
      </Text>
      {wrongAnswers.length ? (
        <>
          <Text style={[styles.heading, { color: colors.text }]}>Cần ôn lại</Text>
          {wrongAnswers.map((item) => (
            <Text key={item.cardId} style={{ color: colors.textMuted }}>
              • {item.frontText}: {item.backText}
            </Text>
          ))}
        </>
      ) : null}
      <AppButton label="Về trang chủ" onPress={() => router.replace('/')} />
      <AppButton
        label="Học lại"
        variant="secondary"
        onPress={() => router.replace('/study/setup')}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, gap: 14, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  accuracy: { fontSize: 42, fontWeight: '800', textAlign: 'center' },
  heading: { fontSize: 19, fontWeight: '700', marginTop: 10 },
});
