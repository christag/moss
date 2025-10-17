/**
 * First-Run Setup Wizard
 * Multi-step wizard for initial M.O.S.S. configuration
 * Creates admin user, primary company, and system preferences
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Icon } from '@/components/ui'

// ============================================================================
// Types
// ============================================================================

interface SetupData {
  // Step 0: Database Configuration
  dbHost: string
  dbPort: number
  dbDatabase: string
  dbUsername: string
  dbPassword: string

  // Step 3: Admin User (was Step 2)
  adminEmail: string
  adminPassword: string
  adminPasswordConfirm: string
  adminFullName: string

  // Step 4: Primary Company & Location (was Step 3)
  companyName: string
  companyWebsite: string
  locationName: string
  locationType: string
  companyAddress: string
  companyCity: string
  companyState: string
  companyZip: string
  companyCountry: string

  // Step 5: System Preferences (was Step 4)
  timezone: string
  dateFormat: string
}

type SetupStep = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6

interface DatabaseStatus {
  connectionOk: boolean
  databaseExists: boolean
  tablesExist: boolean
  needsInitialization: boolean
  needsConfig?: boolean
  message: string
}

// ============================================================================
// Component
// ============================================================================

export default function SetupWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<SetupStep>(-1) // Start at -1 to check if we need config
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)
  const [initSteps, setInitSteps] = useState<string[]>([])
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)

  const [data, setData] = useState<SetupData>({
    // Database config
    dbHost: 'localhost',
    dbPort: 5432,
    dbDatabase: 'moss',
    dbUsername: 'postgres',
    dbPassword: '',

    // Admin user
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    adminFullName: '',

    // Company/location
    companyName: '',
    companyWebsite: '',
    locationName: '',
    locationType: 'office',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    companyCountry: 'United States',

    // Preferences
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
  })

  // ============================================================================
  // Database Initialization Check
  // ============================================================================

  React.useEffect(() => {
    checkSetupStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkSetupStatus = async () => {
    // First check if setup is already completed
    try {
      const setupResponse = await fetch('/api/setup')
      const setupResult = await setupResponse.json()

      if (setupResult.success && setupResult.setupCompleted) {
        // Setup is already complete, redirect to login
        router.push('/login')
        return
      }
    } catch {
      // If setup check fails, continue to database check
    }

    // If setup is not complete, check database status
    checkDatabaseStatus()
  }

  const checkDatabaseStatus = async () => {
    setCheckingStatus(true)
    setError(null)
    try {
      const response = await fetch('/api/setup/init')
      const result = await response.json()

      if (result.success) {
        setDbStatus(result.data)

        // If database config is needed, go to Step 0
        if (result.data.needsConfig) {
          setStep(0)
        }
        // If database is already initialized, skip to Step 2 (Welcome)
        else if (!result.data.needsInitialization) {
          setStep(2)
        }
        // Otherwise, go to Step 1 (Database Init)
        else {
          setStep(1)
        }
      } else {
        setError('Failed to check database status')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setCheckingStatus(false)
    }
  }

  const testDatabaseConnection = async () => {
    setTestingConnection(true)
    setError(null)

    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: data.dbHost,
          port: data.dbPort,
          database: data.dbDatabase,
          username: data.dbUsername,
          password: data.dbPassword,
        }),
      })

      const result = await response.json()

      if (result.success && result.data.success) {
        // Connection successful!
        return true
      } else {
        const errorData = result.data || {}
        setError(
          `${errorData.message || 'Connection failed'}${errorData.details ? `: ${errorData.details}` : ''}`
        )
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection')
      return false
    } finally {
      setTestingConnection(false)
    }
  }

  const initializeDatabase = async () => {
    setLoading(true)
    setError(null)
    setInitSteps([])

    try {
      // Build request body - include database config if we're on step 0
      const requestBody: {
        dbConfig?: {
          host: string
          port: number
          database: string
          username: string
          password: string
        }
      } = {}

      if (step === 0 || !dbStatus?.connectionOk) {
        requestBody.dbConfig = {
          host: data.dbHost,
          port: data.dbPort,
          database: data.dbDatabase,
          username: data.dbUsername,
          password: data.dbPassword,
        }
      }

      const response = await fetch('/api/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      const result = await response.json()

      setInitSteps(result.steps || [])

      if (!response.ok) {
        throw new Error(result.message || 'Database initialization failed')
      }

      // Success! Move to Step 2 (Welcome)
      setTimeout(() => {
        setStep(2)
        setLoading(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database initialization failed')
      setLoading(false)
    }
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  const normalizeUrl = (url: string): string => {
    if (!url || url.trim() === '') return ''
    const trimmed = url.trim()
    // If it looks like a domain but has no protocol, add https://
    if (trimmed && !trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`
    }
    return trimmed
  }

  const handleInputChange = (field: keyof SetupData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleUrlBlur = () => {
    if (data.companyWebsite) {
      const normalized = normalizeUrl(data.companyWebsite)
      setData((prev) => ({ ...prev, companyWebsite: normalized }))
    }
  }

  const validateStep = (currentStep: SetupStep): boolean => {
    setError(null)

    if (currentStep === 0) {
      // Validate database config
      if (!data.dbHost || !data.dbDatabase || !data.dbUsername || !data.dbPassword) {
        setError('Please fill in all required database fields')
        return false
      }

      if (data.dbPort < 1 || data.dbPort > 65535) {
        setError('Please enter a valid port number (1-65535)')
        return false
      }
    }

    if (currentStep === 3) {
      // Validate admin user
      if (!data.adminEmail || !data.adminFullName || !data.adminPassword) {
        setError('Please fill in all required fields')
        return false
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail)) {
        setError('Please enter a valid email address')
        return false
      }

      if (data.adminPassword.length < 8) {
        setError('Password must be at least 8 characters long')
        return false
      }

      if (data.adminPassword !== data.adminPasswordConfirm) {
        setError('Passwords do not match')
        return false
      }
    }

    if (currentStep === 4) {
      // Validate company and location
      if (!data.companyName) {
        setError('Company name is required')
        return false
      }
      if (!data.locationName) {
        setError('Location name is required')
        return false
      }
      // Validate URL format if provided
      if (data.companyWebsite && data.companyWebsite.trim() !== '') {
        const urlPattern = /^https?:\/\/.+\..+/i
        if (!urlPattern.test(data.companyWebsite)) {
          setError('Please enter a valid website URL (e.g., https://example.com)')
          return false
        }
      }
    }

    return true
  }

  const handleNext = async () => {
    if (!validateStep(step)) return

    // Special handling for Step 0 (Database Config) - test connection first
    if (step === 0) {
      const connectionOk = await testDatabaseConnection()
      if (!connectionOk) return

      // Connection successful, proceed to database init
      setStep(1)
      return
    }

    if (step < 6) {
      setStep((step + 1) as SetupStep)
    }
  }

  const handleBack = () => {
    if (step > 2 && step !== 1 && step !== 0) {
      setStep((step - 1) as SetupStep)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Setup failed')
      }

      // Move to completion step
      setStep(6)

      // Redirect to login after 1.5 seconds
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
      setLoading(false)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <div className="setup-container">
        <div className="setup-card">
          {/* Header */}
          <div className="setup-header">
            <div className="logo">M</div>
            <h1>
              {step === 0
                ? 'Database Configuration'
                : step === 1
                  ? 'Database Setup'
                  : step === 6
                    ? 'Setup Complete!'
                    : 'Setup Wizard'}
            </h1>
            {step > 1 && step < 6 && <p className="step-indicator">Step {step - 1} of 4</p>}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" />
              </svg>
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="step-content">
            {step === 0 && (
              <Step0DatabaseConfig
                data={data}
                onChange={handleInputChange}
                testingConnection={testingConnection}
              />
            )}
            {step === 1 && (
              <Step1DatabaseInit
                checkingStatus={checkingStatus}
                dbStatus={dbStatus}
                initSteps={initSteps}
                onInitialize={initializeDatabase}
                loading={loading}
              />
            )}
            {step === 2 && <Step2Welcome />}
            {step === 3 && <Step3AdminUser data={data} onChange={handleInputChange} />}
            {step === 4 && (
              <Step4Company data={data} onChange={handleInputChange} onUrlBlur={handleUrlBlur} />
            )}
            {step === 5 && <Step5Preferences data={data} onChange={handleInputChange} />}
            {step === 6 && <Step6Complete />}
          </div>

          {/* Navigation Buttons */}
          {step === 0 && (
            <div className="nav-buttons">
              <button
                onClick={handleNext}
                disabled={testingConnection}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {testingConnection ? 'Testing Connection...' : 'Test Connection & Continue'}
              </button>
            </div>
          )}
          {step > 1 && step < 6 && (
            <div className="nav-buttons">
              <button
                onClick={handleBack}
                disabled={step === 2 || loading}
                className="btn-secondary"
              >
                Back
              </button>

              {step < 5 ? (
                <button onClick={handleNext} disabled={loading} className="btn-primary">
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              )}
            </div>
          )}

          {/* Footer Note */}
          {step > 1 && step < 6 && (
            <div className="setup-footer">
              <p>
                Need help?{' '}
                <a
                  href="https://github.com/christag/moss"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>{' '}
                | <Link href="/api-docs">API Documentation</Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .setup-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-morning-blue) 0%, var(--color-light-blue) 100%);
          padding: 2rem;
        }

        .setup-card {
          background: var(--color-off-white);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 520px;
        }

        .setup-header {
          background: var(--color-morning-blue);
          color: var(--color-off-white);
          padding: 2rem;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }

        .logo {
          width: 64px;
          height: 64px;
          background: var(--color-off-white);
          color: var(--color-morning-blue);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-center;
          font-size: 36px;
          font-weight: 700;
          margin: 0 auto 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .setup-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .step-indicator {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
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
          margin: 1.5rem 1.5rem 0;
        }

        .step-content {
          padding: 2rem;
        }

        .nav-buttons {
          display: flex;
          gap: 12px;
          padding: 0 2rem 2rem;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--color-morning-blue);
          color: var(--color-off-white);
        }

        .btn-primary:hover:not(:disabled) {
          background: #1570d8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(28, 127, 242, 0.3);
        }

        .btn-secondary {
          background: white;
          color: var(--color-brew-black);
          border: 2px solid #ddd;
        }

        .btn-secondary:hover:not(:disabled) {
          border-color: var(--color-morning-blue);
          color: var(--color-morning-blue);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .setup-footer {
          text-align: center;
          padding: 0 2rem 2rem;
          border-top: 1px solid #e0e0e0;
          margin: 0 2rem;
          padding-top: 1.5rem;
        }

        .setup-footer p {
          font-size: 14px;
          color: var(--color-brew-black-60);
          margin: 0;
        }

        .setup-footer a {
          color: var(--color-morning-blue);
          text-decoration: none;
        }

        .setup-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .setup-card {
            max-width: 100%;
          }

          .setup-header {
            padding: 1.5rem;
          }

          .step-content {
            padding: 1.5rem;
          }

          .nav-buttons {
            padding: 0 1.5rem 1.5rem;
          }
        }
      `}</style>
    </>
  )
}

// ============================================================================
// Step Components
// ============================================================================

interface Step0Props {
  data: SetupData
  onChange: (field: keyof SetupData, value: string | number) => void
  testingConnection: boolean
}

function Step0DatabaseConfig({ data, onChange }: Step0Props) {
  return (
    <>
      <div className="form-step">
        <h2>Database Configuration</h2>
        <p className="subtitle">
          Enter your PostgreSQL connection details. These settings will be used to connect to your
          database server.
        </p>

        <div className="form-row">
          <Input
            label="Host"
            value={data.dbHost}
            onChange={(e) => onChange('dbHost', e.target.value)}
            placeholder="localhost"
            required
          />
          <div style={{ width: '120px' }}>
            <Input
              label="Port"
              type="number"
              value={String(data.dbPort)}
              onChange={(e) => onChange('dbPort', parseInt(e.target.value) || 5432)}
              placeholder="5432"
              required
            />
          </div>
        </div>

        <Input
          label="Database Name"
          value={data.dbDatabase}
          onChange={(e) => onChange('dbDatabase', e.target.value)}
          placeholder="moss"
          required
        />

        <Input
          label="Username"
          value={data.dbUsername}
          onChange={(e) => onChange('dbUsername', e.target.value)}
          placeholder="postgres"
          required
        />

        <Input
          label="Password"
          type="password"
          value={data.dbPassword}
          onChange={(e) => onChange('dbPassword', e.target.value)}
          placeholder="Enter database password"
          required
        />

        <div className="info-box">
          <p>
            <strong>Note:</strong> Make sure your PostgreSQL server is running and accessible from
            this machine. The database will be created automatically if it doesn&apos;t exist.
          </p>
        </div>
      </div>

      <style jsx>{`
        .form-step h2 {
          font-size: 22px;
          margin: 0 0 0.5rem;
          color: var(--color-brew-black);
        }

        .subtitle {
          font-size: 15px;
          color: var(--color-brew-black-60);
          margin: 0 0 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-box {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 6px;
          padding: 12px 16px;
          margin-top: 1.5rem;
        }

        .info-box p {
          font-size: 13px;
          color: #1565c0;
          margin: 0;
        }
      `}</style>
    </>
  )
}

interface Step1Props {
  checkingStatus: boolean
  dbStatus: DatabaseStatus | null
  initSteps: string[]
  onInitialize: () => void
  loading: boolean
}

function Step1DatabaseInit({
  checkingStatus,
  dbStatus,
  initSteps,
  onInitialize,
  loading,
}: Step1Props) {
  if (checkingStatus) {
    return (
      <>
        <div className="status-screen">
          <div className="spinner"></div>
          <h2>Checking Database...</h2>
          <p>Verifying your database connection and configuration</p>
        </div>

        <style jsx>{`
          .status-screen {
            text-align: center;
            padding: 2rem 0;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e0e0e0;
            border-top-color: var(--color-morning-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          h2 {
            font-size: 24px;
            margin: 0 0 0.5rem;
            color: var(--color-brew-black);
          }

          p {
            font-size: 16px;
            color: var(--color-brew-black-60);
            margin: 0;
          }
        `}</style>
      </>
    )
  }

  if (!dbStatus) {
    return (
      <>
        <div className="status-screen">
          <div className="icon-error">
            <Icon name="alert-warning-triangle" size={40} aria-label="Error" />
          </div>
          <h2>Connection Error</h2>
          <p>Unable to reach the database. Please verify your connection settings and try again.</p>
        </div>

        <style jsx>{`
          .status-screen {
            text-align: center;
            padding: 2rem 0;
          }

          .icon-error {
            width: 64px;
            height: 64px;
            background: var(--color-orange);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin: 0 auto 1.5rem;
          }

          h2 {
            font-size: 24px;
            margin: 0 0 0.5rem;
            color: var(--color-orange);
          }

          p {
            font-size: 16px;
            color: var(--color-brew-black-60);
            margin: 0;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }
        `}</style>
      </>
    )
  }

  if (dbStatus.needsInitialization) {
    return (
      <>
        <div className="db-init">
          <h2>Ready to Initialize</h2>
          <p className="message">{dbStatus.message}</p>

          <div className="init-info">
            <h3>Setup Process</h3>
            <ul>
              {!dbStatus.databaseExists && <li>Create PostgreSQL database</li>}
              {!dbStatus.tablesExist && (
                <>
                  <li>Create tables and schema structure</li>
                  <li>Initialize system settings</li>
                </>
              )}
            </ul>
          </div>

          {initSteps.length > 0 && (
            <div className="init-progress">
              <h3>Progress</h3>
              <ul>
                {initSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={onInitialize} disabled={loading} className="btn-init">
            {loading ? (
              'Initializing...'
            ) : (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                <Icon name="rocket-launch" size={20} aria-label="Initialize" />
                Initialize Database
              </span>
            )}
          </button>
        </div>

        <style jsx>{`
          .db-init {
            padding: 1rem 0;
          }

          h2 {
            font-size: 24px;
            margin: 0 0 1rem;
            color: var(--color-brew-black);
            text-align: center;
          }

          .message {
            font-size: 16px;
            color: var(--color-brew-black-60);
            margin: 0 0 2rem;
            text-align: center;
          }

          .init-info,
          .init-progress {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          h3 {
            font-size: 18px;
            margin: 0 0 1rem;
            color: var(--color-brew-black);
          }

          ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          li {
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
            font-size: 15px;
          }

          li:before {
            content: '✓';
            position: absolute;
            left: 0;
            color: var(--color-green);
            font-weight: bold;
          }

          .btn-init {
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
          }

          .btn-init:hover:not(:disabled) {
            background: #1570d8;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(28, 127, 242, 0.3);
          }

          .btn-init:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </>
    )
  }

  return null
}

function Step2Welcome() {
  return (
    <>
      <div className="welcome">
        <h2>Let&apos;s Get Started</h2>
        <p className="intro">
          This wizard will guide you through setting up M.O.S.S. It only takes a few minutes.
        </p>

        <div className="steps-preview">
          <div className="step-preview">
            <div className="step-number">1</div>
            <div className="step-info">
              <h3>Administrator Account</h3>
              <p>Create your admin account</p>
            </div>
          </div>

          <div className="step-preview">
            <div className="step-number">2</div>
            <div className="step-info">
              <h3>Organization Details</h3>
              <p>Set up your organization</p>
            </div>
          </div>

          <div className="step-preview">
            <div className="step-number">3</div>
            <div className="step-info">
              <h3>System Preferences</h3>
              <p>Configure timezone and date format</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .welcome {
          padding: 1rem 0;
        }

        h2 {
          font-size: 24px;
          margin: 0 0 0.5rem;
          color: var(--color-brew-black);
          text-align: center;
        }

        .intro {
          font-size: 16px;
          color: var(--color-brew-black-60);
          margin: 0 0 2rem;
          text-align: center;
        }

        .steps-preview {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .step-preview {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .step-preview:hover {
          border-color: var(--color-morning-blue);
          background: #f8f9fa;
        }

        .step-number {
          width: 40px;
          height: 40px;
          background: var(--color-morning-blue);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 0.25rem;
          color: var(--color-brew-black);
        }

        .step-info p {
          font-size: 14px;
          color: var(--color-brew-black-60);
          margin: 0;
        }
      `}</style>
    </>
  )
}

interface StepProps {
  data: SetupData
  onChange: (field: keyof SetupData, value: string) => void
  onUrlBlur?: () => void
}

function Step3AdminUser({ data, onChange }: StepProps) {
  return (
    <>
      <div className="form-step">
        <h2>Administrator Account</h2>
        <p className="subtitle">Create your admin account. You can add more users later.</p>

        <Input
          label="Full Name"
          value={data.adminFullName}
          onChange={(e) => onChange('adminFullName', e.target.value)}
          placeholder="John Doe"
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={data.adminEmail}
          onChange={(e) => onChange('adminEmail', e.target.value)}
          placeholder="admin@example.com"
          required
        />

        <div className="password-hint">Minimum 8 characters with letters, numbers, and symbols</div>

        <Input
          label="Password"
          type="password"
          value={data.adminPassword}
          onChange={(e) => onChange('adminPassword', e.target.value)}
          placeholder="Enter a strong password"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          value={data.adminPasswordConfirm}
          onChange={(e) => onChange('adminPasswordConfirm', e.target.value)}
          placeholder="Re-enter your password"
          required
        />
      </div>

      <style jsx>{`
        .form-step h2 {
          font-size: 22px;
          margin: 0 0 0.5rem;
          color: var(--color-brew-black);
        }

        .subtitle {
          font-size: 15px;
          color: var(--color-brew-black-60);
          margin: 0 0 1.5rem;
        }

        .password-hint {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          color: #1565c0;
          margin-bottom: 1rem;
        }
      `}</style>
    </>
  )
}

function Step4Company({ data, onChange, onUrlBlur }: StepProps) {
  return (
    <>
      <div className="form-step">
        <h2>Organization & Location</h2>
        <p className="subtitle">Set up your primary organization and main location.</p>

        <Input
          label="Company Name"
          value={data.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          placeholder="Acme Corporation"
          required
        />

        <Input
          label="Website"
          type="url"
          value={data.companyWebsite}
          onChange={(e) => onChange('companyWebsite', e.target.value)}
          onBlur={onUrlBlur}
          placeholder="example.com (https:// will be added automatically)"
        />

        <div className="section-divider">
          <h3>Primary Location</h3>
        </div>

        <Input
          label="Location Name"
          value={data.locationName}
          onChange={(e) => onChange('locationName', e.target.value)}
          placeholder="Headquarters"
          required
        />

        <div className="form-group">
          <label htmlFor="locationType">Location Type</label>
          <select
            id="locationType"
            value={data.locationType}
            onChange={(e) => onChange('locationType', e.target.value)}
          >
            <option value="office">Office</option>
            <option value="datacenter">Data Center</option>
            <option value="colo">Colocation Facility</option>
            <option value="remote">Remote</option>
            <option value="warehouse">Warehouse</option>
            <option value="studio">Studio</option>
            <option value="broadcast_facility">Broadcast Facility</option>
          </select>
        </div>

        <Input
          label="Street Address"
          value={data.companyAddress}
          onChange={(e) => onChange('companyAddress', e.target.value)}
          placeholder="123 Main Street"
        />

        <div className="form-row">
          <Input
            label="City"
            value={data.companyCity}
            onChange={(e) => onChange('companyCity', e.target.value)}
            placeholder="New York"
          />
          <Input
            label="State/Province"
            value={data.companyState}
            onChange={(e) => onChange('companyState', e.target.value)}
            placeholder="NY"
          />
        </div>

        <div className="form-row">
          <Input
            label="ZIP/Postal Code"
            value={data.companyZip}
            onChange={(e) => onChange('companyZip', e.target.value)}
            placeholder="10001"
          />
          <Input
            label="Country"
            value={data.companyCountry}
            onChange={(e) => onChange('companyCountry', e.target.value)}
            placeholder="United States"
          />
        </div>
      </div>

      <style jsx>{`
        .form-step h2 {
          font-size: 22px;
          margin: 0 0 0.5rem;
          color: var(--color-brew-black);
        }

        .subtitle {
          font-size: 15px;
          color: var(--color-brew-black-60);
          margin: 0 0 1.5rem;
        }

        .section-divider {
          border-top: 2px solid #e0e0e0;
          margin: 1.5rem 0 1rem;
          padding-top: 1rem;
        }

        .section-divider h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-brew-black);
          margin: 0 0 1rem;
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

        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          background: white;
          transition: all 0.2s;
        }

        .form-group select:focus {
          outline: none;
          border-color: var(--color-morning-blue);
          box-shadow: 0 0 0 3px rgba(28, 127, 242, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
      `}</style>
    </>
  )
}

function Step5Preferences({ data, onChange }: StepProps) {
  return (
    <>
      <div className="form-step">
        <h2>System Preferences</h2>
        <p className="subtitle">Configure default settings. You can change these later.</p>

        <div className="form-group">
          <label htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            value={data.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">America/New York (EST/EDT)</option>
            <option value="America/Chicago">America/Chicago (CST/CDT)</option>
            <option value="America/Denver">America/Denver (MST/MDT)</option>
            <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
          </select>
          <p className="help-text">Used for all timestamps and scheduled tasks</p>
        </div>

        <div className="form-group">
          <label htmlFor="dateFormat">Date Format</label>
          <select
            id="dateFormat"
            value={data.dateFormat}
            onChange={(e) => onChange('dateFormat', e.target.value)}
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-10-12)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (12/10/2025)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (10/12/2025)</option>
            <option value="DD MMM YYYY">DD MMM YYYY (12 Oct 2025)</option>
          </select>
          <p className="help-text">How dates will be displayed throughout the system</p>
        </div>
      </div>

      <style jsx>{`
        .form-step h2 {
          font-size: 22px;
          margin: 0 0 0.5rem;
          color: var(--color-brew-black);
        }

        .subtitle {
          font-size: 15px;
          color: var(--color-brew-black-60);
          margin: 0 0 1.5rem;
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

        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          background: white;
          transition: all 0.2s;
        }

        .form-group select:focus {
          outline: none;
          border-color: var(--color-morning-blue);
          box-shadow: 0 0 0 3px rgba(28, 127, 242, 0.1);
        }

        .help-text {
          font-size: 13px;
          color: var(--color-brew-black-60);
          margin: 0.5rem 0 0;
        }
      `}</style>
    </>
  )
}

function Step6Complete() {
  return (
    <>
      <div className="complete-screen">
        <div className="success-icon">✓</div>
        <h2>Setup Complete!</h2>
        <p>Your M.O.S.S. installation is ready. Redirecting to login...</p>

        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <style jsx>{`
        .complete-screen {
          text-align: center;
          padding: 3rem 0;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--color-green) 0%, var(--color-lime-green) 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 24px rgba(40, 192, 119, 0.3);
        }

        h2 {
          font-size: 28px;
          margin: 0 0 0.5rem;
          color: var(--color-brew-black);
        }

        p {
          font-size: 16px;
          color: var(--color-brew-black-60);
          margin: 0 0 2rem;
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .loading-dots span {
          width: 12px;
          height: 12px;
          background: var(--color-morning-blue);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  )
}
