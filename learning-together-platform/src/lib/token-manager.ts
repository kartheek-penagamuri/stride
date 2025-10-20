'use client'

import { TokenPair } from '@/types'

const ACCESS_TOKEN_KEY = 'learning_together_access_token'
const REFRESH_TOKEN_KEY = 'learning_together_refresh_token'
const TOKEN_EXPIRY_KEY = 'learning_together_token_expiry'

export class TokenManager {
  private static instance: TokenManager
  private refreshPromise: Promise<TokenPair> | null = null

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }

  /**
   * Store tokens in localStorage
   */
  setTokens(tokens: TokenPair): void {
    if (typeof window === 'undefined') return

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    localStorage.setItem(TOKEN_EXPIRY_KEY, tokens.expiresAt.toISOString())
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Get token expiry from localStorage
   */
  getTokenExpiry(): Date | null {
    if (typeof window === 'undefined') return null
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    return expiry ? new Date(expiry) : null
  }

  /**
   * Check if access token is expired or will expire soon (within 1 minute)
   */
  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry()
    if (!expiry) return true

    const now = new Date()
    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000)
    
    return expiry <= oneMinuteFromNow
  }

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<TokenPair> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken)

    try {
      const tokens = await this.refreshPromise
      this.setTokens(tokens)
      return tokens
    } finally {
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(refreshToken: string): Promise<TokenPair> {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to refresh token')
    }

    const result = await response.json()
    return {
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      expiresAt: new Date(result.data.expiresAt),
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.getAccessToken()
    
    if (!accessToken) {
      return null
    }

    if (this.isTokenExpired()) {
      try {
        const tokens = await this.refreshAccessToken()
        return tokens.accessToken
      } catch (error) {
        console.error('Failed to refresh token:', error)
        this.clearTokens()
        return null
      }
    }

    return accessToken
  }

  /**
   * Logout by clearing tokens and optionally calling logout endpoint
   */
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken()
    
    // Clear tokens immediately
    this.clearTokens()

    // Optionally revoke refresh token on server
    if (refreshToken) {
      try {
        await fetch('/api/auth/token', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      } catch (error) {
        console.error('Failed to revoke token:', error)
        // Don't throw error since tokens are already cleared locally
      }
    }
  }

  /**
   * Create authenticated fetch function
   */
  createAuthenticatedFetch() {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = await this.getValidAccessToken()
      
      if (!token) {
        throw new Error('No valid access token available')
      }

      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      }

      return fetch(url, {
        ...options,
        headers,
      })
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance()