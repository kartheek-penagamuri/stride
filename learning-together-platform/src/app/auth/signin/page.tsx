'use client'

import { getProviders, signIn, getSession } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
      setLoading(false)
    }

    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push(callbackUrl)
      }
    }

    checkSession()
    fetchProviders()
  }, [callbackUrl, router])

  const handleSignIn = (providerId: string) => {
    signIn(providerId, { callbackUrl })
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return '🔍'
      case 'github':
        return '🐙'
      case 'azure-ad':
        return '🏢'
      default:
        return '🔐'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Stride
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your preferred sign-in method
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error === 'OAuthSignin' && 'Error in constructing an authorization URL.'}
                  {error === 'OAuthCallback' && 'Error in handling the response from an OAuth provider.'}
                  {error === 'OAuthCreateAccount' && 'Could not create OAuth account.'}
                  {error === 'EmailCreateAccount' && 'Could not create email account.'}
                  {error === 'Callback' && 'Error in the OAuth callback handler route.'}
                  {error === 'OAuthAccountNotLinked' && 'Email already associated with another account.'}
                  {error === 'EmailSignin' && 'Check your email address.'}
                  {error === 'CredentialsSignin' && 'Sign in failed. Check the details you provided are correct.'}
                  {error === 'SessionRequired' && 'Please sign in to access this page.'}
                  {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(error) && 'An unexpected error occurred.'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleSignIn(provider.id)}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <span className="text-xl">{getProviderIcon(provider.id)}</span>
                </span>
                Sign in with {provider.name}
              </button>
            ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}