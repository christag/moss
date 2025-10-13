/**
 * First-Run Setup Wizard
 * Multi-step wizard for initial M.O.S.S. configuration
 * Creates admin user, primary company, and system preferences
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

// ============================================================================
// Types
// ============================================================================

interface SetupData {
  // Step 2: Admin User
  adminEmail: string
  adminPassword: string
  adminPasswordConfirm: string
  adminFullName: string

  // Step 3: Primary Company
  companyName: string
  companyWebsite: string
  companyAddress: string
  companyCity: string
  companyState: string
  companyZip: string
  companyCountry: string

  // Step 4: System Preferences
  timezone: string
  dateFormat: string
}

type SetupStep = 1 | 2 | 3 | 4 | 5

// ============================================================================
// Component
// ============================================================================

export default function SetupWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<SetupStep>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<SetupData>({
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    adminFullName: '',
    companyName: '',
    companyWebsite: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    companyCountry: 'United States',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
  })

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleInputChange = (field: keyof SetupData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateStep = (currentStep: SetupStep): boolean => {
    setError(null)

    if (currentStep === 2) {
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

    if (currentStep === 3) {
      // Validate company
      if (!data.companyName) {
        setError('Company name is required')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (!validateStep(step)) return

    if (step < 5) {
      setStep((step + 1) as SetupStep)
    }
  }

  const handleBack = () => {
    if (step > 1) {
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
      setStep(5)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
      setLoading(false)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-heading mb-2">Welcome to M.O.S.S.</h1>
          <p className="text-body-secondary">Let&apos;s set up your IT asset management system</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded ${s <= step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-body-secondary">Step {step} of 5</div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {step === 1 && <Step1Welcome />}
          {step === 2 && <Step2AdminUser data={data} onChange={handleInputChange} />}
          {step === 3 && <Step3Company data={data} onChange={handleInputChange} />}
          {step === 4 && <Step4Preferences data={data} onChange={handleInputChange} />}
          {step === 5 && <Step5Complete />}
        </div>

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Step Components
// ============================================================================

function Step1Welcome() {
  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-light rounded-full mb-4">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Let&apos;s Get Started</h2>
      <p className="text-body-secondary mb-6">
        This wizard will guide you through the initial setup of M.O.S.S.
        <br />
        It should only take a few minutes.
      </p>

      <div className="text-left max-w-md mx-auto space-y-3">
        <div className="flex items-start">
          <span className="inline-block w-6 h-6 bg-primary text-white rounded-full text-center text-sm font-bold mr-3">
            1
          </span>
          <p className="text-body-secondary">Create your administrator account</p>
        </div>
        <div className="flex items-start">
          <span className="inline-block w-6 h-6 bg-primary text-white rounded-full text-center text-sm font-bold mr-3">
            2
          </span>
          <p className="text-body-secondary">Set up your primary organization</p>
        </div>
        <div className="flex items-start">
          <span className="inline-block w-6 h-6 bg-primary text-white rounded-full text-center text-sm font-bold mr-3">
            3
          </span>
          <p className="text-body-secondary">Configure system preferences</p>
        </div>
      </div>
    </div>
  )
}

interface StepProps {
  data: SetupData
  onChange: (field: keyof SetupData, value: string) => void
}

function Step2AdminUser({ data, onChange }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create Administrator Account</h2>
      <p className="text-body-secondary mb-6">
        This account will have full access to all system features and settings.
      </p>

      <div className="space-y-4">
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

        <Input
          label="Password"
          type="password"
          value={data.adminPassword}
          onChange={(e) => onChange('adminPassword', e.target.value)}
          placeholder="Enter a strong password"
          helperText="Minimum 8 characters"
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
    </div>
  )
}

function Step3Company({ data, onChange }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Primary Organization</h2>
      <p className="text-body-secondary mb-6">
        Enter information about your organization. You can add more companies later.
      </p>

      <div className="space-y-4">
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
          placeholder="https://www.example.com"
        />

        <Input
          label="Street Address"
          value={data.companyAddress}
          onChange={(e) => onChange('companyAddress', e.target.value)}
          placeholder="123 Main Street"
        />

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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
    </div>
  )
}

function Step4Preferences({ data, onChange }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">System Preferences</h2>
      <p className="text-body-secondary mb-6">
        Configure default settings for your M.O.S.S. installation.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-body mb-1">Timezone</label>
          <select
            value={data.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
        </div>

        <div>
          <label className="block text-sm font-medium text-body mb-1">Date Format</label>
          <select
            value={data.dateFormat}
            onChange={(e) => onChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-10-12)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (12/10/2025)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (10/12/2025)</option>
            <option value="DD MMM YYYY">DD MMM YYYY (12 Oct 2025)</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function Step5Complete() {
  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Setup Complete!</h2>
      <p className="text-body-secondary mb-6">
        Your M.O.S.S. installation is now ready to use.
        <br />
        Redirecting you to the login page...
      </p>

      <div className="mt-8">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    </div>
  )
}
