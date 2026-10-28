import { useEffect, useRef, useState } from 'react'
import { AuthApiError, authRequest } from '../services/authApi'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const refreshRequest = useRef(null)

  useEffect(() => {
    let active = true
    if (!refreshRequest.current) {
      refreshRequest.current = authRequest('/refresh', { method: 'POST' })
        .finally(() => {
          refreshRequest.current = null
        })
    }

    refreshRequest.current
      .then((session) => {
        if (active) {
          setUser(session.user)
          setAccessToken(session.accessToken)
        }
      })
      .catch((error) => {
        if (active && !(error instanceof AuthApiError && error.status === 401)) {
          setSessionError(error.message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function startSession(path, values) {
    const session = await authRequest(path, {
      method: 'POST',
      body: JSON.stringify(values),
    })
    setUser(session.user)
    setAccessToken(session.accessToken)
    setSessionError('')
    return session
  }

  function login(values) {
    return startSession('/admin/login', values)
  }

  function register(values) {
    return startSession('/admin/register', values)
  }

  async function logout() {
    let message = ''
    try {
      await authRequest('/logout', { method: 'POST' })
    } catch (error) {
      message = `You were signed out locally, but the server could not confirm sign-out: ${error.message}`
    } finally {
      setUser(null)
      setAccessToken('')
    }
    return message
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        loading,
        login,
        logout,
        register,
        sessionError,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
