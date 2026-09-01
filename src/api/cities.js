import { api } from './client';

export function fetchActiveCities() {
  return api.get('/cities');
}