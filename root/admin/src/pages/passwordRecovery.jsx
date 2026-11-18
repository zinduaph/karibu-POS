import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { completeAdminPasswordReset, requestAdminPasswordReset } from '../services/authApi'

function PasswordRecovery() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [codeRequested, setCodeRequested] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (codeRequested && newPassword !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      if (codeRequested) {
        const result = await completeAdminPasswordReset(email, code, newPassword)
        setMessage(result.message)
        setCompleted(true)
        setCode('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const result = await requestAdminPasswordReset(email)
        setMessage(result.message)
        setCodeRequested(true)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      subtitle={codeRequested
        ? 'Enter the six-digit code sent to your email and choose a new password.'
        : 'Enter your admin account email and we’ll send a code if an account exists.'}
      title={codeRequested ? 'Reset your password' : 'Forgot your password?'}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {codeRequested ? (
          <>
            <label className="block text-sm font-medium text-[#2C3947]">
              Email address
              <input
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                disabled
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm font-medium text-[#2C3947]">
              Six-digit code
              <input
                autoComplete="one-time-code"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                pattern="\d{6}"
                required
                value={code}
              />
            </label>
            <label className="block text-sm font-medium text-[#2C3947]">
              New password
              <input
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                maxLength={200}
                minLength={12}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </label>
            <label className="block text-sm font-medium text-[#2C3947]">
              Confirm new password
              <input
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                maxLength={200}
                minLength={12}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
          </>
        ) : (
          <label className="block text-sm font-medium text-[#2C3947]">
            Admin email address
            <input
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
        )}
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        {message && <p className="text-sm text-green-700" role="status">{message}</p>}
        {completed ? (
          <Link className="block text-center font-semibold text-[#547A95] hover:underline" to="/login">Go to sign in</Link>
        ) : (
          <button
            className="w-full rounded-xl bg-[#547A95] px-4 py-3 font-semibold text-white transition hover:bg-[#42657e] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Please wait…' : codeRequested ? 'Reset password' : 'Send code'}
          </button>
        )}
      </form>
      {codeRequested && !completed && (
        <button
          className="mt-3 w-full text-sm font-semibold text-[#547A95] underline hover:text-[#42657e] disabled:opacity-60"
          disabled={submitting}
          onClick={async () => {
            setError('')
            setMessage('')
            setSubmitting(true)
            try {
              const result = await requestAdminPasswordReset(email)
              setMessage(result.message)
            } catch (requestError) {
              setError(requestError.message)
            } finally {
              setSubmitting(false)
            }
          }}
          type="button"
        >
          Resend code
        </button>
      )}
      {!completed && (
        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered it? <Link className="font-semibold text-[#547A95] hover:underline" to="/login">Back to sign in</Link>
        </p>
      )}
    </AuthLayout>
  )
}

export default PasswordRecovery
