import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRepositories } from '@/database/repositories/use-repositories';
import { queryKeys } from '@/services/query/query-keys';
import { StudySessionService } from '../services/study-session.service';
import type { SubmitStudyAnswerInput } from '../repositories/study-repository';
import type { StudySetup } from '../types/study.types';
import { SystemClock } from '../utils/study-time';
import { systemRandom } from '../utils/shuffle';
function useService() {
  const { study } = useRepositories();
  return useMemo(() => new StudySessionService(study, new SystemClock(), systemRandom), [study]);
}
export function useActiveStudySessionQuery() {
  const { study } = useRepositories();
  return useQuery({ queryKey: queryKeys.study.active, queryFn: () => study.findActiveSession() });
}
export function useStudySessionQuery(id: string) {
  const { study } = useRepositories();
  return useQuery({
    queryKey: queryKeys.study.session(id),
    queryFn: () => study.findSessionById(id),
    enabled: Boolean(id),
  });
}
export function useCurrentStudyItemQuery(id: string) {
  const { study } = useRepositories();
  return useQuery({
    queryKey: queryKeys.study.currentItem(id),
    queryFn: () => study.getCurrentSessionItem(id),
    enabled: Boolean(id),
  });
}
export function useStudyResultQuery(id: string) {
  const { study } = useRepositories();
  return useQuery({
    queryKey: queryKeys.study.result(id),
    queryFn: () => study.getSessionResult(id),
    enabled: Boolean(id),
  });
}
export function useCreateStudySessionMutation() {
  const service = useService();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (setup: StudySetup) => service.startSession(setup),
    onSuccess: (session) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.study.active }),
        client.setQueryData(queryKeys.study.session(session.id), session),
      ]),
  });
}
export function useSubmitStudyAnswerMutation(id: string) {
  const service = useService();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<SubmitStudyAnswerInput, 'reviewedAt'>) => service.submitAnswer(input),
    onSuccess: (result) =>
      Promise.all([
        client.setQueryData(queryKeys.study.session(id), result.session),
        client.invalidateQueries({ queryKey: queryKeys.study.currentItem(id) }),
      ]),
  });
}
export function useCompleteStudySessionMutation() {
  const service = useService();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => service.completeSession(id),
    onSuccess: (result) => {
      client.setQueryData(queryKeys.study.result(result.session.id), result);
      client.invalidateQueries({ queryKey: queryKeys.study.active });
    },
  });
}
export function usePauseStudyMutation() {
  const { study } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, at }: { id: string; at: number }) => study.pauseSession(id, at),
    onSuccess: (_, v) => client.invalidateQueries({ queryKey: queryKeys.study.session(v.id) }),
  });
}
export function useResumeStudyMutation() {
  const { study } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, at }: { id: string; at: number }) => study.resumeSession(id, at),
    onSuccess: (_, v) => client.invalidateQueries({ queryKey: queryKeys.study.session(v.id) }),
  });
}
export function useAbandonStudyMutation() {
  const { study } = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, at }: { id: string; at: number }) => study.abandonSession(id, at),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.study.active }),
  });
}
