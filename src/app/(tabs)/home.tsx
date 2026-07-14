import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useActiveStudySessionQuery } from '@/features/study/hooks/use-study';
import { AppButton } from '@/shared/components/app-button';
import { useAppTheme } from '@/shared/theme/use-app-theme';
export default function HomeScreen() {
  const { colors } = useAppTheme();
  const active = useActiveStudySessionQuery();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Hôm nay học gì?</Text>
      <Text style={{ color: colors.textMuted }}>Ôn đều mỗi ngày để ghi nhớ lâu hơn.</Text>
      {active.data ? (
        <Link href={{ pathname: '/study/session', params: { id: active.data.id } }} asChild>
          <View>
            <AppButton
              label={`Tiếp tục phiên học (${active.data.answeredCards}/${active.data.totalCards})`}
            />
          </View>
        </Link>
      ) : null}
      <Link href="/study/setup" asChild>
        <View>
          <AppButton label="Bắt đầu học" />
        </View>
      </Link>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 18, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800' },
});
