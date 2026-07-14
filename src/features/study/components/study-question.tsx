import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/shared/components/app-button';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import type { StudyQuestion } from '../types/study.types';
export function StudyQuestionView({
  question,
  selected,
  showAnswer,
  onSelect,
  onReveal,
  onSubmitTyping,
}: {
  question: StudyQuestion;
  selected: string | null;
  showAnswer: boolean;
  onSelect: (value: string) => void;
  onReveal: () => void;
  onSubmitTyping: () => void;
}) {
  const { colors } = useAppTheme();
  const input = useRef<TextInput>(null);
  useEffect(() => {
    if (question.mode === 'typing') input.current?.focus();
  }, [question]);
  if (question.mode === 'flashcard')
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.prompt, { color: colors.text }]}>{question.frontText}</Text>
        <Text style={{ color: colors.textMuted }}>{question.phonetic}</Text>
        {showAnswer ? (
          <>
            <Text style={[styles.answer, { color: colors.primary }]}>{question.backText}</Text>
            <Text style={{ color: colors.textMuted }}>{question.exampleText}</Text>
          </>
        ) : (
          <AppButton label="Xem đáp án" onPress={onReveal} />
        )}
      </View>
    );
  if (question.mode === 'multiple_choice')
    return (
      <View style={styles.container}>
        <Text style={[styles.prompt, { color: colors.text }]}>{question.promptText}</Text>
        {question.options.map((option) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === option.id }}
            key={option.id}
            disabled={showAnswer}
            onPress={() => onSelect(option.id)}
            style={[
              styles.option,
              {
                borderColor: selected === option.id ? colors.primary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={{ color: colors.text }}>{option.text}</Text>
          </Pressable>
        ))}
      </View>
    );
  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.text }]}>{question.promptText}</Text>
      <TextInput
        ref={input}
        value={selected ?? ''}
        onChangeText={onSelect}
        onSubmitEditing={onSubmitTyping}
        editable={!showAnswer}
        placeholder="Nhập từ tiếng Anh"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      />
      {question.hint ? (
        <Text style={{ color: colors.textMuted }}>Gợi ý: {question.hint}</Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  card: {
    minHeight: 300,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  prompt: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  answer: { fontSize: 23, fontWeight: '700' },
  option: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
  },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 18 },
});
