/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Client API Service
 * Handles Bearer token headers, error parsing, and standardized envelopes.
 */

import type { ApiResponse } from '../types/index.ts';

const TOKEN_KEY = 'tustudyhub_auth_token';

export class ApiClient {
  public static getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public static setToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Storage unavailable
    }
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || {
            code: `HTTP_${response.status}`,
            message: data?.message || response.statusText || 'Request failed'
          }
        };
      }

      return data as ApiResponse<T>;
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to reach the server. Please check your network connection.'
        }
      };
    }
  }
}
