export interface ReminderSettings{id:string;enabled:boolean;reminderHour:number;reminderMinute:number;reminderDays:number[];remindOnlyWhenDue:boolean;minimumDueCards:number;timezoneId:string|null;lastScheduledAt:number|null}
export type NotificationPermissionStatus='undetermined'|'granted'|'denied';
