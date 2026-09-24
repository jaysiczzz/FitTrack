import { apiRequest } from './client';

export interface CheckInRecord {
  id: string;
  userId: string;
  date: string;
  moodId: 'fire' | 'strong' | 'good' | 'tired' | 'rest' | string;
  moodLabel: string;
  coachTip: string;
  quote?: string | null;
  quoteAuthor?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInStreakStats {
  currentStreak: number;
  bestStreak: number;
  totalCheckIns: number;
  todayCheckedIn: boolean;
  todayCheckIn?: CheckInRecord | null;
}

export interface SaveCheckInPayload {
  date?: string;
  moodId: string;
  moodLabel: string;
  coachTip: string;
  quote?: string;
  quoteAuthor?: string;
  notes?: string;
}

export async function getTodayCheckInApi(date?: string): Promise<{
  success: boolean;
  date: string;
  checkIn: CheckInRecord | null;
}> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest(`/api/checkin/today${query}`, { method: 'GET' });
}

export async function saveCheckInApi(payload: SaveCheckInPayload): Promise<{
  success: boolean;
  message: string;
  checkIn: CheckInRecord;
  streak: CheckInStreakStats;
}> {
  return apiRequest('/api/checkin', {
    method: 'POST',
    body: payload,
  });
}

export async function getCheckInStreakApi(date?: string): Promise<{
  success: boolean;
  currentStreak: number;
  bestStreak: number;
  totalCheckIns: number;
  todayCheckedIn: boolean;
  todayCheckIn: CheckInRecord | null;
}> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest(`/api/checkin/streak${query}`, { method: 'GET' });
}

export async function getCheckInHistoryApi(
  limit: number = 30,
  date?: string
): Promise<{
  success: boolean;
  history: CheckInRecord[];
  streak: CheckInStreakStats;
}> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  if (date) params.append('date', date);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/checkin/history${query}`, { method: 'GET' });
}

export async function deleteTodayCheckInApi(date?: string): Promise<{
  success: boolean;
  message: string;
}> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest(`/api/checkin/today${query}`, { method: 'DELETE' });
}
