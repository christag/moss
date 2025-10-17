/**
 * Password Change Form Component
 * Allows users to change their password
 */

'use client'

import React, { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { toast } from 'sonner'

export function PasswordChangeForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Password changed successfully')
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        toast.error(result.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('An error occurred while changing password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '1rem' }}>Change Password</h3>

      <Input
        label="Current Password"
        type="password"
        value={formData.currentPassword}
        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
        placeholder="Enter current password"
        required
      />

      <Input
        label="New Password"
        type="password"
        value={formData.newPassword}
        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
        placeholder="Enter new password (min 8 characters)"
        required
        style={{ marginTop: '1rem' }}
      />

      <Input
        label="Confirm New Password"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        placeholder="Confirm new password"
        required
        style={{ marginTop: '1rem' }}
      />

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <Button type="submit" disabled={loading}>
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
          disabled={loading}
        >
          Clear
        </Button>
      </div>

      <p
        style={{
          marginTop: '1rem',
          fontSize: '13px',
          color: 'var(--color-brew-black-60)',
        }}
      >
        Password must be at least 8 characters long and different from your current password.
      </p>
    </form>
  )
}
