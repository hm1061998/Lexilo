import type { SQLiteDatabase } from 'expo-sqlite';
import { reminderSettingsSchema } from '../schemas/reminder-settings.schema';
import type { ReminderSettings } from '../types/notification.types';
import type { NotificationSettingsRepository } from './notification-settings.repository';
const ID = 'local-default-notification-settings';
interface SettingsRow {
  id: string;
  enabled: number;
  reminder_hour: number;
  reminder_minute: number;
  reminder_days: string;
  remind_only_when_due: number;
  minimum_due_cards: number;
  timezone_id: string | null;
  last_scheduled_at: number | null;
}
export class SQLiteNotificationSettingsRepository implements NotificationSettingsRepository {
  constructor(private db: SQLiteDatabase) {}
  async get(): Promise<ReminderSettings> {
    const r = await this.db.getFirstAsync<SettingsRow>(
      'SELECT * FROM notification_settings WHERE id=?',
      [ID],
    );
    if (!r) throw new Error('Không tìm thấy cài đặt nhắc học.');
    return {
      id: r.id,
      enabled: r.enabled === 1,
      reminderHour: r.reminder_hour,
      reminderMinute: r.reminder_minute,
      reminderDays: JSON.parse(r.reminder_days) as number[],
      remindOnlyWhenDue: r.remind_only_when_due === 1,
      minimumDueCards: r.minimum_due_cards,
      timezoneId: r.timezone_id,
      lastScheduledAt: r.last_scheduled_at,
    };
  }
  async save(input: Omit<ReminderSettings, 'id' | 'lastScheduledAt'>, now: number) {
    const value = reminderSettingsSchema.parse(input);
    await this.db.runAsync(
      `UPDATE notification_settings SET enabled=?,reminder_hour=?,reminder_minute=?,reminder_days=?,remind_only_when_due=?,minimum_due_cards=?,timezone_id=?,updated_at=?,sync_status='pending' WHERE id=?`,
      [
        value.enabled ? 1 : 0,
        value.reminderHour,
        value.reminderMinute,
        JSON.stringify(value.reminderDays),
        value.remindOnlyWhenDue ? 1 : 0,
        value.minimumDueCards,
        input.timezoneId,
        now,
        ID,
      ],
    );
    return this.get();
  }
  async markScheduled(at: number) {
    await this.db.runAsync('UPDATE notification_settings SET last_scheduled_at=? WHERE id=?', [
      at,
      ID,
    ]);
  }
}
