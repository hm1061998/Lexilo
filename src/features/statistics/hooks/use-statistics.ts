import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/database/repositories/use-repositories';
import { queryKeys } from '@/services/query/query-keys';
import { shiftDate } from '../algorithms/statistics-calculators';
import type { LearningGoals } from '../types/statistics.types';
const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function useDashboardQuery(){const {statistics}=useRepositories();const today=localDate();const weekday=(new Date().getDay()+6)%7;return useQuery({queryKey:queryKeys.statistics.dashboard(today),queryFn:()=>statistics.getHomeDashboard(today,shiftDate(today,-weekday),Date.now())});}
export function useProgressQuery(days=30){const {statistics}=useRepositories();const end=localDate(),start=shiftDate(end,-days+1);return useQuery({queryKey:queryKeys.statistics.progress(start,end),queryFn:async()=>({overview:await statistics.getProgressOverview({startDate:start,endDate:end}),daily:await statistics.getDailyStatistics({startDate:start,endDate:end}),heatmap:await statistics.getHeatmap({startDate:shiftDate(end,-83),endDate:end}),decks:await statistics.getDeckProgress(),difficult:await statistics.getDifficultCards(5)})});}
export function useGoalsQuery(){const {statistics}=useRepositories();return useQuery({queryKey:queryKeys.statistics.goals,queryFn:()=>statistics.getLearningGoals()});}
export function useUpdateGoalsMutation(){const {statistics}=useRepositories();const client=useQueryClient();return useMutation({mutationFn:(g:Omit<LearningGoals,'id'|'updatedAt'>)=>statistics.updateLearningGoals(g,Date.now()),onSuccess:()=>client.invalidateQueries({queryKey:queryKeys.statistics.all})});}
