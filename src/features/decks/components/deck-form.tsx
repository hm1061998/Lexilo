import { TagSelector } from '@/features/tags/components/tag-selector';
import { AppButton } from '@/shared/components/app-button';
import { AppInput } from '@/shared/components/app-input';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deckFormSchema, type DeckFormValues } from '../schemas/deck-form-schema';

export function DeckForm({
  defaultValues,
  isSubmitting,
  onSubmit,
}: {
  defaultValues?: Partial<DeckFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: DeckFormValues) => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      name: '',
      description: '',
      languageFrom: 'en',
      languageTo: 'vi',
      isFavorite: false,
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
        contentContainerStyle={[
          styles.content,
          { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 18) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <AppInput
              label="Tên bộ thẻ"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={errors.name?.message}
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <AppInput
              label="Mô tả"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={errors.description?.message}
              multiline
            />
          )}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <Controller
              control={control}
              name="languageFrom"
              render={({ field }) => (
                <AppInput
                  label="Ngôn ngữ nguồn"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.languageFrom?.message}
                />
              )}
            />
          </View>
          <View style={styles.flex}>
            <Controller
              control={control}
              name="languageTo"
              render={({ field }) => (
                <AppInput
                  label="Ngôn ngữ đích"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.languageTo?.message}
                />
              )}
            />
          </View>
        </View>
        <Controller
          control={control}
          name="isFavorite"
          render={({ field }) => (
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text }}>Bộ thẻ yêu thích</Text>
              <Switch value={field.value} onValueChange={field.onChange} />
            </View>
          )}
        />
        <Controller
          control={control}
          name="tagIds"
          render={({ field }) => <TagSelector value={field.value} onChange={field.onChange} />}
        />
        <AppButton label="Lưu bộ thẻ" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  switchRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
