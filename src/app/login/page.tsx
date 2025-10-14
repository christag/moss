/**
 * Login Page
 * Email/password authentication for M.O.S.S.
 */
'use client'

import { useState, FormEvent, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('[LOGIN] Attempting sign in...')
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      console.log('[LOGIN] Sign in result:', result)

      if (result?.error) {
        console.error('[LOGIN] Sign in error:', result.error)
        setError('Invalid email or password')
        setLoading(false)
      } else if (result?.ok) {
        console.log('[LOGIN] Sign in successful, redirecting to:', callbackUrl)
        // Use window.location for more reliable redirect in Next.js 15
        window.location.href = callbackUrl
      } else {
        console.error('[LOGIN] Unexpected result:', result)
        setError('An error occurred. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('[LOGIN] Exception during sign in:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          {/* Logo */}
          <div className="login-header">
            <div className="logo">M</div>
            <h1>M.O.S.S.</h1>
            <p className="subtitle">Material Organization & Storage System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-banner">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                    fill="currentColor"
                  />
                </svg>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                placeholder="your.email@company.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="help-text">
              Contact your administrator if you need access or have forgotten your password.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            var(--color-morning-blue) 0%,
            var(--color-light-blue) 100%
          );
          padding: 2rem;
        }

        .login-card {
          background: var(--color-off-white);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 440px;
          padding: 3rem;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo {
          width: 80px;
          height: 80px;
          background: var(--color-morning-blue);
          color: var(--color-off-white);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          margin: 0 auto 1.5rem;
          box-shadow: 0 4px 12px rgba(28, 127, 242, 0.3);
        }

        .login-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: var(--color-brew-black);
          margin: 0 0 0.5rem;
        }

        .subtitle {
          font-size: 16px;
          color: var(--color-brew-black-60);
          margin: 0;
        }

        .login-form {
          margin-bottom: 2rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fee;
          border: 1px solid var(--color-orange);
          border-radius: 8px;
          color: var(--color-orange);
          font-size: 14px;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          font-size: 14px;
          color: var(--color-brew-black);
          margin-bottom: 0.5rem;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;
          background: white;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--color-morning-blue);
          box-shadow: 0 0 0 3px rgba(28, 127, 242, 0.1);
        }

        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .login-button {
          width: 100%;
          padding: 14px;
          background: var(--color-morning-blue);
          color: var(--color-off-white);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .login-button:hover:not(:disabled) {
          background: #1570d8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(28, 127, 242, 0.3);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          border-top: 1px solid #e0e0e0;
          padding-top: 1.5rem;
        }

        .help-text {
          font-size: 14px;
          color: var(--color-brew-black-60);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 2rem 1.5rem;
          }

          .login-header h1 {
            font-size: 28px;
          }

          .logo {
            width: 64px;
            height: 64px;
            font-size: 40px;
          }
        }
      `}</style>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
