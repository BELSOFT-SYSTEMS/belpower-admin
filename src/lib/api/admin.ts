import {
  adminFetch,
  adminHeaders,
  ADMIN_API_BASE,
  clearAdminSession,
  redirectToSignIn,
} from '@/lib/adminAuth';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const adminApi = {
  async request<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      return await adminFetch<T>(path, options);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  async get<T = unknown>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  },

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },

  async upload<T = unknown>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    const token = adminHeaders().Authorization;

    const res = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: token } : undefined,
    });

    const body = (await res.json()) as ApiResponse<T>;

    if (res.status === 401) {
      clearAdminSession();
      redirectToSignIn();
      throw new Error('Session expired');
    }

    if (!res.ok || body.success === false) {
      throw new Error(body.error || body.message || 'Request failed');
    }

    return body.data as T;
  },
};

export const useAdminApi = () => adminApi;
