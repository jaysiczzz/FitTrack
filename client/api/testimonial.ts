import { apiRequest } from './client';

export interface TestimonialItem {
  id: string;
  authorName: string;
  rating: number;
  content: string;
  highlightBadge?: string | null;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | null;
  createdAt: string;
}

export interface TestimonialsResponse {
  success: boolean;
  averageRating: number;
  totalCount: number;
  testimonials: TestimonialItem[];
}

export interface SubmitTestimonialPayload {
  rating: number;
  content: string;
  highlightBadge?: string | null;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | null;
}

export const getTestimonialsApi = (
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS'
): Promise<TestimonialsResponse> => {
  const query = goal ? `?goal=${goal}` : '';
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

export const deleteMyTestimonialApi = (): Promise<{ success: boolean; message: string }> =>
  apiRequest('/api/testimonials/my', {
    method: 'DELETE',
  });
