import { httpApi } from './httpApi';
import { mockApi } from './mockApi';

// Defaults to live backend HTTP API with transparent fallback to mockApi
export const api = httpApi;

export { mockApi, httpApi };
export * from './types';
