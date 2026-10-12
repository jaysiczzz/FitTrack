import { apiRequest } from './client';

export interface WeightLogItem {
  id: string;
  weight: number;
  date: string; // YYYY-MM-DD
  notes?: string | null;
  createdAt: string;
}

export interface WeightStats {
  currentWeight: number;
  startingWeight: number;
  targetWeight: number | null;
  totalChange: number;
  remainingToGoal: number | null;
  progressPercentage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  logCount: number;
  trend: 'losing' | 'gaining' | 'stable';
}

export interface WeightApiResponse {
  success: boolean;
  logs: WeightLogItem[];
  stats: WeightStats;
  message?: string;
}

export const saveWeightLogApi = (data: {
  weight: number;
  date?: string;
  notes?: string;
}): Promise<WeightApiResponse> => {
  return apiRequest('/api/weight', {
    method: 'POST',
    body: data,
  });
};
