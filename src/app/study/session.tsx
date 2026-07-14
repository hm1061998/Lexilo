import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { evaluateTypingAnswer } from '@/features/study/algorithms/answer-normalizer';
import { ReviewRatingButtons } from '@/features/study/components/review-rating-buttons';
import { StudyProgressBar } from '@/features/study/components/study-progress-bar';
import { StudyQuestionView } from '@/features/study/components/study-question';
import {
  useAbandonStudyMutation,
  useCompleteStudySessionMutation,
  useCurrentStudyItemQuery,
  usePauseStudyMutation,
  useResumeStudyMutation,
  useStudySessionQuery,
  useSubmitStudyAnswerMutation,
} from '@/features/study/hooks/use-study';
import { useStudySessionStore } from '@/features/study/store/study-session.store';
import type { ReviewRating } from '@/features/study/types/study.types';
import { AppButton } from '@/shared/components/app-button';
import { LoadingState } from '@/shared/components/query-state';
import { useAppTheme } from '@/shared/theme/use-app-theme';
export default function StudySessionScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const session = useStudySessionQuery(id);
  const item = useCurrentStudyItemQuery(id);
  const submit = useSubmitStudyAnswerMutation(id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteStudySessionMutation();
  const pause = usePauseStudyMutation();
  const { mutate: resumeSession, isPending: isResuming } = useResumeStudyMutation();
  const abandon = useAbandonStudyMutation();
  const ui = useStudySessionStore();
  const resetQuestion = useStudySessionStore((state) => state.resetQuestion);
  useEffect(() => {
    resetQuestion(Date.now());
  }, [item.data?.id, resetQuestion]);
  useEffect(() => {
    if (session.data?.status === 'paused' && !isResuming) {
      resumeSession({ id, at: Date.now() });
    }
  }, [id, isResuming, resumeSession, session.data?.status]);
  useEffect(() => {
    if (
      session.data &&
      session.data.answeredCards >= session.data.totalCards &&
      session.data.status !== 'completed' &&
      !isCompleting
    )
      completeSession(id, {
        onSuccess: () => router.replace({ pathname: '/study/result', params: { id } }),
      });
  }, [completeSession, id, isCompleting, session.data]);
  if (session.isLoading || item.isLoading) return <LoadingState />;
  if (!session.data || !item.data) return <LoadingState />;
  const currentItem = item.data;
  const question = currentItem.question;
  const evaluate = () => {
    if (question.mode === 'multiple_choice') {
      const correct = ui.selectedAnswer === question.correctOptionId;
      ui.setFeedback(correct ? 'correct' : 'incorrect', correct ? 'good' : 'again');
    } else if (question.mode === 'typing') {
      const result = evaluateTypingAnswer(ui.selectedAnswer ?? '', question.acceptedAnswers);
      ui.setFeedback(
        result.isCorrect ? 'correct' : 'incorrect',
        result.isCorrect ? 'good' : 'again',
      );
    }
  };
  const rate = (rating: ReviewRating) => {
    let submitted: string | null = null;
    let expected = '';
    let correct = rating !== 'again';
    if (question.mode === 'multiple_choice') {
      submitted = question.options.find((option) => option.id === ui.selectedAnswer)?.text ?? null;
      expected =
        question.options.find((option) => option.id === question.correctOptionId)?.text ?? '';
      correct = ui.selectedAnswer === question.correctOptionId;
    } else if (question.mode === 'typing') {
      submitted = ui.selectedAnswer;
      expected = question.acceptedAnswers[0] ?? '';
      correct = evaluateTypingAnswer(submitted ?? '', question.acceptedAnswers).isCorrect;
    } else expected = question.backText;
    submit.mutate(
      {
        sessionId: id,
        sessionItemId: currentItem.id,
        cardId: currentItem.cardId,
        mode: currentItem.mode,
        submittedAnswer: submitted,
        expectedAnswer: expected,
        rating,
        isCorrect: correct,
        responseTimeMs: Math.max(0, Date.now() - ui.answerStartedAt),
        usedHint: ui.usedHint,
      },
      { onError: () => Alert.alert('Không thể lưu kết quả', 'Vui lòng thử lại.') },
    );
  };
  const exit = () =>
    Alert.alert('Rời phiên học?', 'Bạn có thể tạm dừng để tiếp tục sau hoặc kết thúc phiên này.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Tạm dừng',
        onPress: () =>
          pause.mutate({ id, at: Date.now() }, { onSuccess: () => router.replace('/') }),
      },
      {
        text: 'Kết thúc',
        style: 'destructive',
        onPress: () =>
          abandon.mutate({ id, at: Date.now() }, { onSuccess: () => router.replace('/') }),
      },
    ]);
  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={exit}>
          <Text style={{ color: colors.danger }}>Thoát</Text>
        </Pressable>
        <StudyProgressBar current={session.data.answeredCards} total={session.data.totalCards} />
        <Text style={{ color: colors.textMuted }}>XP {session.data.earnedXp}</Text>
      </View>
      <View style={styles.content}>
        <StudyQuestionView
          question={question}
          selected={ui.selectedAnswer}
          showAnswer={ui.showAnswer}
          onSelect={ui.selectAnswer}
          onReveal={ui.revealAnswer}
          onSubmitTyping={evaluate}
        />
        {ui.feedback ? (
          <Text
            accessibilityRole="alert"
            style={[
              styles.feedback,
              { color: ui.feedback === 'correct' ? colors.primary : colors.danger },
            ]}
          >
            {ui.feedback === 'correct' ? '✓ Chính xác' : '✕ Chưa chính xác'}
          </Text>
        ) : null}
        {question.mode !== 'flashcard' && !ui.showAnswer ? (
          <AppButton label="Kiểm tra" disabled={!ui.selectedAnswer} onPress={evaluate} />
        ) : null}
        {ui.showAnswer ? <ReviewRatingButtons disabled={submit.isPending} onSelect={rate} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 16, gap: 10 },
  content: { flex: 1, padding: 20, gap: 18, justifyContent: 'center' },
  feedback: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
});
