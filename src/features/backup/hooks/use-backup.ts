import { useMutation, useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';
import { BackupService } from '../services/backup.service';

function useService() {
  const db = useSQLiteContext();
  return useMemo(() => new BackupService(db), [db]);
}
export function useBackupHistory() {
  const s = useService();
  return useQuery({ queryKey: ['backup', 'history'], queryFn: () => s.history() });
}
export function useCreateBackup() {
  const s = useService();
  return useMutation({ mutationFn: () => s.create() });
}
