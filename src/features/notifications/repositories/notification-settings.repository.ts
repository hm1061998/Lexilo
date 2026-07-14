import type { ReminderSettings } from '../types/notification.types';
export interface NotificationSettingsRepository {
  get(): Promise<ReminderSettings>;
  save(
    input: Omit<ReminderSettings, 'id' | 'lastScheduledAt'>,
    now: number,
  ): Promise<ReminderSettings>;
  markScheduled(at: number): Promise<void>;
}
