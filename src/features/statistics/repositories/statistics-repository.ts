import type { DeckProgressSummary,DifficultCardSummary,HomeDashboardSummary,LearningGoals,ProgressOverview,StatisticsRange,StudyActivityDay,StudyHistoryItem,DailyStatisticsPoint } from '../types/statistics.types';
export interface StatisticsRepository {
 getHomeDashboard(today:string,weekStart:string,now:number):Promise<HomeDashboardSummary>;
 getDailyStatistics(range:StatisticsRange):Promise<DailyStatisticsPoint[]>;
 getProgressOverview(range:StatisticsRange):Promise<ProgressOverview>;
 getDeckProgress():Promise<DeckProgressSummary[]>;
 getDifficultCards(limit?:number):Promise<DifficultCardSummary[]>;
 getHeatmap(range:StatisticsRange):Promise<StudyActivityDay[]>;
 getStudyHistory(limit?:number,offset?:number):Promise<StudyHistoryItem[]>;
 getLearningGoals():Promise<LearningGoals>;
 updateLearningGoals(goals:Omit<LearningGoals,'id'|'updatedAt'>,now:number):Promise<LearningGoals>;
}
