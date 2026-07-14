import { AppButton } from '@/shared/components/app-button';
import { StyleSheet, Text, View } from 'react-native';
import type { ReviewRating } from '../types/study.types';
const ratings: readonly [ReviewRating, string, string][] = [
  ['again', 'Quên', 'Ôn lại sau 10 phút'],
  ['hard', 'Khó', 'Ôn lại sớm'],
  ['good', 'Nhớ', 'Lịch ôn tiêu chuẩn'],
  ['easy', 'Rất dễ', 'Tăng khoảng ôn'],
];
export function ReviewRatingButtons({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (rating: ReviewRating) => void;
}) {
  return (
    <View style={styles.row}>
      {ratings.map(([rating, label, hint]) => (
        <View key={rating} style={styles.item}>
          <AppButton
            label={label}
            variant={rating === 'again' ? 'danger' : 'secondary'}
            disabled={disabled}
            accessibilityHint={hint}
            onPress={() => onSelect(rating)}
          />
          <Text style={styles.hint}>{hint}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { gap: 8 },
  item: { gap: 2 },
  hint: { fontSize: 11, textAlign: 'center', color: '#667085' },
});
