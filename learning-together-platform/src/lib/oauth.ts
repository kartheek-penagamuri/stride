// import { TokenSet } from 'next-auth' // Commented out as it's not used

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tokenType?: string
  scope?: string
}

export interface OAuthUserInfo {
  id: string
  email: string
  name?: string
  picture?: string
  verified_email?: boolean
}

/**
 * Exchange OAuth authorization code for access tokens
 */
export async function exchangeCodeForTokens(
  provider: string,
  code: string,
  redirectUri: string
): Promise<OAuthTokens> {
  let tokenEndpoint: string
  let clientId: string
  let clientSecret: string

  switch (provider) {
    case 'google':
      tokenEndpoint = 'https://oauth2.googleapis.com/token'
      clientId = process.env.GOOGLE_CLIENT_ID!
      clientSecret = process.env.GOOGLE_CLIENT_SECRET!
      break
    case 'github':
      tokenEndpoint = 'https://github.com/login/oauth/access_token'
      clientId = process.env.GITHUB_CLIENT_ID!
      clientSecret = process.env.GITHUB_CLIENT_SECRET!
      break
    case 'azure-ad':
      tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      clientId = process.env.MICROSOFT_CLIENT_ID!
      clientSecret = process.env.MICROSOFT_CLIENT_SECRET!
      break
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params,
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`)
  }

  const tokens = await response.json()

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
    tokenType: tokens.token_type,
    scope: tokens.scope,
  }
}

/**
 * Refresh OAuth access token using refresh token
 */
export async function refreshAccessToken(
  provider: string,
  refreshToken: string
): Promise<OAuthTokens> {
  let tokenEndpoint: string
  let clientId: string
  let clientSecret: string

  switch (provider) {
    case 'google':
      tokenEndpoint = 'https://oauth2.googleapis.com/token'
      clientId = process.env.GOOGLE_CLIENT_ID!
      clientSecret = process.env.GOOGLE_CLIENT_SECRET!
      break
    case 'github':
      // GitHub doesn't support refresh tokens
      throw new Error('GitHub does not support refresh tokens')
    case 'azure-ad':
      tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      clientId = process.env.MICROSOFT_CLIENT_ID!
      clientSecret = process.env.MICROSOFT_CLIENT_SECRET!
      break
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params,
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`)
  }

  const tokens = await response.json()

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken, // Some providers don't return new refresh token
    expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
    tokenType: tokens.token_type,
    scope: tokens.scope,
  }
}

/**
 * Get user information from OAuth provider
 */
export async function getUserInfo(
  provider: string,
  accessToken: string
): Promise<OAuthUserInfo> {
  let userInfoEndpoint: string

  switch (provider) {
    case 'google':
      userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo'
      break
    case 'github':
      userInfoEndpoint = 'https://api.github.com/user'
      break
    case 'azure-ad':
      userInfoEndpoint = 'https://graph.microsoft.com/v1.0/me'
      break
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const response = await fetch(userInfoEndpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`)
  }

  const userInfo = await response.json()

  // Normalize user info across providers
  switch (provider) {
    case 'google':
      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
      }
    case 'github':
      return {
        id: userInfo.id.toString(),
        email: userInfo.email,
        name: userInfo.name || userInfo.login,
        picture: userInfo.avatar_url,
      }
    case 'azure-ad':
      return {
        id: userInfo.id,
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName,
        picture: userInfo.photo?.['@odata.mediaReadLink'],
      }
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`)
  }
}

/**
 * Validate OAuth access token
 */
export async function validateAccessToken(
  provider: string,
  accessToken: string
): Promise<boolean> {
  try {
    await getUserInfo(provider, accessToken)
    return true
  } catch (error) {
    console.error('Token validation failed:', error)
    return false
  }
}