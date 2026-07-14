import { TagSelector } from '@/features/tags/components/tag-selector';
import { AppButton } from '@/shared/components/app-button';
import { AppInput } from '@/shared/components/app-input';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { cardFormSchema, type CardFormValues } from '../schemas/card-form-schema';

const fields: {
  name: keyof Pick<
    CardFormValues,
    | 'frontText'
    | 'backText'
    | 'phonetic'
    | 'partOfSpeech'
    | 'exampleText'
    | 'exampleTranslation'
    | 'note'
    | 'synonymsText'
    | 'antonymsText'
  >;
  label: string;
  multiline?: boolean;
}[] = [
  { name: 'frontText', label: 'Từ tiếng Anh' },
  { name: 'backText', label: 'Nghĩa tiếng Việt' },
  { name: 'phonetic', label: 'Phiên âm IPA' },
  { name: 'partOfSpeech', label: 'Loại từ' },
  { name: 'exampleText', label: 'Câu ví dụ', multiline: true },
  { name: 'exampleTranslation', label: 'Dịch câu ví dụ', multiline: true },
  { name: 'note', label: 'Ghi chú', multiline: true },
  { name: 'synonymsText', label: 'Từ đồng nghĩa (dấu phẩy)' },
  { name: 'antonymsText', label: 'Từ trái nghĩa (dấu phẩy)' },
];
export function CardForm({
  defaultValues,
  isSubmitting,
  onSubmit,
}: {
  defaultValues?: Partial<CardFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: CardFormValues) => void;
}) {
  const { colors } = useAppTheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      frontText: '',
      backText: '',
      phonetic: '',
      partOfSpeech: '',
      exampleText: '',
      exampleTranslation: '',
      note: '',
      synonymsText: '',
      antonymsText: '',
      difficulty: 0,
      tagIds: [],
      ...defaultValues,
    },
  });
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        {fields.map(({ name, label, multiline }) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <AppInput
                label={label}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline={multiline}
                error={errors[name]?.message}
              />
            )}
          />
        ))}
        <Controller
          control={control}
          name="difficulty"
          render={({ field }) => (
            <AppInput
              label="Mức độ khó (0–5)"
              value={String(field.value)}
              keyboardType="number-pad"
              onChangeText={(value) => field.onChange(Number(value) || 0)}
              error={errors.difficulty?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="tagIds"
          render={({ field }) => <TagSelector value={field.value} onChange={field.onChange} />}
        />
        <AppButton label="Lưu flashcard" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({ content: { padding: 20, gap: 16 } });
