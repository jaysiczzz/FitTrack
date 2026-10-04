import { apiRequest } from './client';

export interface TestimonialItem {
  id: string;
  userId?: string | null;
  authorName: string;
  avatarUrl?: string | null;
  rating: number;
  content: string;
  highlightBadge?: string | null;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | null;
  helpfulCount?: number;
  hasVoted?: boolean;
  weightChangeKg?: number | null;
  durationWeeks?: number | null;
  verifiedAthlete?: boolean;
  createdAt: string;
}

export interface TestimonialsResponse {
  success: boolean;
  averageRating: number;
  totalCount: number;
  testimonials: TestimonialItem[];
}

export interface SubmitTestimonialPayload {
  id?: string;
  rating: number;
  content: string;
  highlightBadge?: string | null;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | null;
  weightChangeKg?: number | null;
  durationWeeks?: number | null;
  avatarUrl?: string | null;
}

export const getTestimonialsApi = (
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS',
  sortBy?: 'featured' | 'helpful' | 'highest_rated' | 'recent',
  limit?: number
): Promise<TestimonialsResponse> => {
  const params = new URLSearchParams();
  if (goal) params.append('goal', goal);
  if (sortBy) params.append('sortBy', sortBy);
  if (limit) params.append('limit', String(limit));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/testimonials${query}`);
};

export const getMyTestimonialApi = (): Promise<{
  success: boolean;
  testimonial: TestimonialItem | null;
}> => apiRequest('/api/testimonials/my');

export const submitTestimonialApi = (
  payload: SubmitTestimonialPayload
): Promise<{ success: boolean; message: string; testimonial: TestimonialItem }> =>
  apiRequest('/api/testimonials', {
    method: 'POST',
    body: payload,
  });

export const toggleHelpfulTestimonialApi = (
  id: string
): Promise<{ success: boolean; hasVoted: boolean; helpfulCount: number; message: string }> =>
  apiRequest(`/api/testimonials/${id}/helpful`, {
    method: 'POST',
  });

export const deleteMyTestimonialApi = (id?: string): Promise<{ success: boolean; message: string }> => {
  const query = id ? `?id=${encodeURIComponent(id)}` : '';
  return apiRequest(`/api/testimonials/my${query}`, {
    method: 'DELETE',
  });
};
