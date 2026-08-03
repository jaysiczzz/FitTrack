import { apiRequest } from './client';

export const registerUser = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  height: number;
  weight: number;
  age: number;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
}) => apiRequest('/api/auth/register', { method: 'POST', body: payload });

export const loginUser = (payload: { email: string; password: string }) =>
  apiRequest('/api/auth/login', { method: 'POST', body: payload });