import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/shared/components/app-button';
import { AppInput } from '@/shared/components/app-input';
import { useAppTheme } from '@/shared/theme/use-app-theme';
import { useCreateTagMutation, useTagsQuery } from '../hooks/use-tags';

export function TagSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { colors } = useAppTheme();
  const tags = useTagsQuery();
  const createTag = useCreateTagMutation();
  const [name, setName] = useState('');
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
      <View style={styles.tags}>
        {tags.data?.map((tag) => (
          <Pressable
            key={tag.id}
            onPress={() => toggle(tag.id)}
            style={[
              styles.chip,
              {
                borderColor: colors.border,
                backgroundColor: value.includes(tag.id) ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text style={{ color: value.includes(tag.id) ? colors.background : colors.text }}>
              {tag.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.create}>
        <View style={styles.flex}>
          <AppInput label="Tag mới" value={name} maxLength={50} onChangeText={setName} />
        </View>
        <AppButton
          label="Thêm"
          variant="secondary"
          disabled={!name.trim()}
          loading={createTag.isPending}
          onPress={() =>
            createTag.mutate(
              { name },
              {
                onSuccess: (tag) => {
                  onChange([...value, tag.id]);
                  setName('');
                },
              },
            )
          }
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  create: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  flex: { flex: 1 },
});
