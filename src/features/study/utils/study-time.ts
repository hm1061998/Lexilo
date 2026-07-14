export interface Clock {
  now(): number;
}
export class SystemClock implements Clock {
  now() {
    return Date.now();
  }
}
export function toLocalStudyDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
