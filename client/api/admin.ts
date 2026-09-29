import { apiRequest } from './client';
import { SubscriptionTierType, SubscriptionStatusType } from './subscription';

export interface AdminSystemStats {
  users: {
    total: number;
    athletes: number;
    admins: number;
    newThisWeek: number;
  };
  activity: {
    totalWorkoutsCompleted: number;
    workoutsCompletedToday: number;
    totalMealsLogged: number;
    mealsLoggedToday: number;
    totalStories: number;
  };
  aiEngine: {
    foodScansToday: number;
    coachQuestionsToday: number;
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  };
  financials: {
    mrr: number;
    grossRevenue: number;
    netRevenue: number;
    platformBalance: number;
    currency: string;
    activeProSubscribers: number;
    activeMonthly: number;
    activeAnnual: number;
    activeLifetime: number;
  };
  support: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  timestamp: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  height: number;
  weight: number;
  targetWeight?: number | null;
  age: number;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  createdAt: string;
  subscription?: {
    tier: SubscriptionTierType;
    status: SubscriptionStatusType;
    currentPeriodEnd?: string | null;
  } | null;
  _count?: {
    workoutSessions: number;
    dailyFoodLogs: number;
  };
}

export interface AdminSupportTicket {
  id: string;
  userId?: string | null;
  userEmail: string;
  userName?: string;
  category: 'BUG' | 'FEATURE' | 'QUESTION' | 'GENERAL';
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

/**
 * Fetch real-time aggregated system health, activity, AI usage, and finances
 */
export const getAdminSystemStatsApi = (): Promise<{
  success: boolean;
  stats: AdminSystemStats;
}> => apiRequest('/api/admin/stats');

/**
 * Search and filter users directly from the database
 */
export const getAdminUsersApi = (params?: {
  search?: string;
  role?: 'ALL' | 'USER' | 'ADMIN';
  tier?: 'ALL' | 'PRO' | 'FREE';
}): Promise<{
  success: boolean;
  total: number;
  users: AdminUserItem[];
}> => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.role && params.role !== 'ALL') query.append('role', params.role);
  if (params?.tier && params.tier !== 'ALL') query.append('tier', params.tier);

  const qs = query.toString();
  return apiRequest(`/api/admin/users${qs ? `?${qs}` : ''}`);
};

/**
 * Update user system role (USER <-> ADMIN)
 */
export const updateUserRoleApi = (
  userId: string,
  role: 'USER' | 'ADMIN'
): Promise<{
  success: boolean;
  message: string;
  user: { id: string; email: string; firstName: string; lastName: string; role: 'USER' | 'ADMIN' };
}> =>
  apiRequest(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: { role },
  });

/**
 * Permanently delete a user account from the platform
 */
export const deleteUserApi = (
  userId: string
): Promise<{
  success: boolean;
  message: string;
}> =>
  apiRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });

/**
 * Fetch user support tickets and feedback submissions
 */
export const getAdminTicketsApi = (
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
): Promise<{
  success: boolean;
  stats: AdminTicketStats;
  tickets: AdminSupportTicket[];
}> => {
  const qs = status ? `?status=${status}` : '';
  return apiRequest(`/api/admin/tickets${qs}`);
};

/**
 * Update support ticket status and administrative resolution notes
 */
export const updateAdminTicketApi = (
  id: string,
  updates: { status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'; adminNotes?: string }
): Promise<{
  success: boolean;
  message: string;
  ticket: AdminSupportTicket;
}> =>
  apiRequest(`/api/admin/tickets/${id}`, {
    method: 'PATCH',
    body: updates,
  });

/**
 * Delete a support ticket
 */
export const deleteAdminTicketApi = (
  id: string
): Promise<{
  success: boolean;
  message: string;
}> =>
  apiRequest(`/api/admin/tickets/${id}`, {
    method: 'DELETE',
  });

/**
 * Toggle featured visibility of an athlete transformation story
 */
export const toggleStoryFeatureApi = (
  id: string
): Promise<{
  success: boolean;
  isFeatured: boolean;
  message: string;
}> =>
  apiRequest(`/api/admin/stories/${id}/feature`, {
    method: 'PATCH',
  });

/**
 * Delete an athlete transformation story from the database
 */
export const deleteStoryApi = (
  id: string
): Promise<{
  success: boolean;
  message: string;
}> =>
  apiRequest(`/api/admin/stories/${id}`, {
    method: 'DELETE',
  });
