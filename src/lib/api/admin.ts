// Remove unused toast import
// import { toast } from 'sonner';

const API_BASE_URL = '/api/admin';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Define proper types instead of using 'any'
interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const adminApi = {
  /**
   * Make an authenticated API request
   */
  async request<T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data.data as T;
    } catch (error) {
      console.error('API request failed:', error);

      // Handle 401 Unauthorized
      if (error instanceof Error && error.message.includes('401')) {
        // Clear any existing auth state
        document.cookie = 'adminToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        // Redirect to login
        window.location.href = '/admin/sign-in';
      }

      // Re-throw the error for the caller to handle
      throw error;
    }
  },

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },

  /**
   * Upload file
   */
  async upload<T = unknown>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Let the browser set the Content-Type with boundary
      },
    });
  },
};

// Export a hook for components to use
export const useAdminApi = () => {
  return adminApi;
};
