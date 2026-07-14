import { z } from 'zod';
export const reminderSettingsSchema=z.object({enabled:z.boolean(),reminderHour:z.number().int().min(0).max(23),reminderMinute:z.number().int().min(0).max(59),reminderDays:z.array(z.number().int().min(1).max(7)).min(1,'Hãy chọn ít nhất một ngày').transform(x=>[...new Set(x)].sort()),remindOnlyWhenDue:z.boolean(),minimumDueCards:z.number().int().min(1).max(1000)});
