import { reminderSettingsSchema } from '../reminder-settings.schema';
const valid = {
  enabled: true,
  reminderHour: 20,
  reminderMinute: 0,
  reminderDays: [1],
  remindOnlyWhenDue: true,
  minimumDueCards: 1,
};
describe('reminder settings', () => {
  it('validates time', () => {
    expect(() => reminderSettingsSchema.parse({ ...valid, reminderHour: 24 })).toThrow();
    expect(() => reminderSettingsSchema.parse({ ...valid, reminderMinute: 60 })).toThrow();
  });
  it('requires days', () =>
    expect(() => reminderSettingsSchema.parse({ ...valid, reminderDays: [] })).toThrow());
  it('deduplicates days', () =>
    expect(
      reminderSettingsSchema.parse({ ...valid, reminderDays: [2, 1, 2] }).reminderDays,
    ).toEqual([1, 2]));
});
