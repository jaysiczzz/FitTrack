import { apiRequest } from './client';

export interface FeedbackPayload {
  category: 'BUG' | 'FEATURE' | 'QUESTION' | 'GENERAL';
  subject: string;
  message: string;
  email?: string;
}

export const sendFeedbackApi = (payload: FeedbackPayload) =>
  apiRequest('/api/support/feedback', {
    method: 'POST',
    body: payload,
  });
