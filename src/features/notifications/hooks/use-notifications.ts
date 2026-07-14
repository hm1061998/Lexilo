import { useRepositories } from '@/database/repositories/use-repositories';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationSchedulerService } from '../services/notification-scheduler.service';
import type { ReminderSettings } from '../types/notification.types';

export function useReminderSettings() {
  const { notificationSettings } = useRepositories();
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationSettings.get(),
  });
}
export function useSaveReminder() {
  const { notificationSettings, statistics } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<ReminderSettings, 'id' | 'lastScheduledAt'>) => {
      const scheduler = new NotificationSchedulerService();
      if (input.enabled) {
        let permission = await scheduler.permission();
        if (permission === 'undetermined') permission = await scheduler.requestPermission();
        if (permission !== 'granted') input = { ...input, enabled: false };
      }
      const now = new Date(),
        today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const weekday = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - weekday);
      const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      const due = (await statistics.getHomeDashboard(today, weekStart, now.getTime())).dueCards;
      const saved = await notificationSettings.save(input, Date.now());
      await scheduler.reschedule(saved, due);
      await notificationSettings.markScheduled(Date.now());
      return saved;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
