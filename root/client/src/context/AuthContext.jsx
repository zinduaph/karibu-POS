import { useEffect, useRef, useState } from 'react'
import { AuthContext } from './auth-context'
import { authRequest } from '../services/authApi'
import { setAccessToken } from '../services/authToken'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const refreshRequest = useRef(null)

  useEffect(() => {
    let active = true
    if (!refreshRequest.current) {
      refreshRequest.current = authRequest('/refresh', { method: 'POST' }).finally(() => {
        refreshRequest.current = null
      })
    }

    refreshRequest.current
      .then((session) => {
        if (active) applySession(session)
      })
      .catch((error) => {
        if (active && error.status !== 401) setSessionError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function applySession(session) {
    if (!session?.accessToken || !session.user) {
      throw new Error('The authentication server returned an incomplete session.')
    }
    setAccessToken(session.accessToken)
    setUser(session.user)
  }

  async function login(values) {
    const session = await authRequest('/cashier/login', {
      method: 'POST',
      body: JSON.stringify(values),
    })
    if (session?.user?.role !== 'cashier') {
      throw new Error('The authentication server did not return a cashier account.')
    }
    applySession(session)
    setSessionError('')
    return session
  }

  async function changePin(values) {
    const session = await authRequest('/change-pin', {
      method: 'POST',
      body: JSON.stringify(values),
      accessToken: true,
    })
    applySession(session)
    return session
  }

  async function logout() {
    let notice = ''
    try {
      await authRequest('/logout', { method: 'POST' })
    } catch (error) {
      notice = `You were signed out on this device, but the server could not confirm sign-out: ${error.message}`
    } finally {
      setAccessToken('')
      setUser(null)
    }
    return notice
  }

  return (
    <AuthContext.Provider value={{ changePin, loading, login, logout, sessionError, user }}>
      {children}
    </AuthContext.Provider>
  )
}
