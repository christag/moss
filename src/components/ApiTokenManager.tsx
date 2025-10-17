/**
 * API Token Manager Component
 * Allows users to create, view, and revoke their API tokens
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button, Input, Checkbox } from '@/components/ui'
import { toast } from 'sonner'

interface ApiToken {
  id: string
  token_name: string
  scopes: string[]
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  is_active: boolean
}

export function ApiTokenManager() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    tokenName: '',
    scopes: {
      read: true,
      write: false,
      admin: false,
    },
    expiresInDays: '',
  })

  // Fetch tokens
  const fetchTokens = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/api-tokens')
      const result = await response.json()

      if (result.success) {
        setTokens(result.tokens || [])
      } else {
        toast.error('Failed to load API tokens')
      }
    } catch (error) {
      console.error('Error fetching tokens:', error)
      toast.error('An error occurred while loading tokens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  // Create token
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault()

    const scopes = Object.entries(formData.scopes)
      .filter(([, enabled]) => enabled)
      .map(([scope]) => scope)

    if (scopes.length === 0) {
      toast.error('Please select at least one scope')
      return
    }

    try {
      const response = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName: formData.tokenName,
          scopes,
          expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('API token created successfully')
        setCreatedToken(result.token)
        setShowCreateForm(false)
        setFormData({
          tokenName: '',
          scopes: { read: true, write: false, admin: false },
          expiresInDays: '',
        })
        fetchTokens()
      } else {
        toast.error(result.message || 'Failed to create token')
      }
    } catch (error) {
      console.error('Error creating token:', error)
      toast.error('An error occurred while creating token')
    }
  }

  // Revoke token
  const handleRevokeToken = async (tokenId: string, tokenName: string) => {
    if (
      !confirm(`Are you sure you want to revoke the token "${tokenName}"? This cannot be undone.`)
    ) {
      return
    }

    try {
      const response = await fetch(`/api/api-tokens/${tokenId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Token revoked successfully')
        fetchTokens()
      } else {
        toast.error(result.message || 'Failed to revoke token')
      }
    } catch (error) {
      console.error('Error revoking token:', error)
      toast.error('An error occurred while revoking token')
    }
  }

  // Copy token to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Token copied to clipboard')
  }

  if (loading) {
    return <div>Loading API tokens...</div>
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>API Tokens</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create New Token'}
        </Button>
      </div>

      {/* Show newly created token */}
      {createdToken && (
        <div
          style={{
            background: '#e8f5e9',
            border: '1px solid var(--color-green)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--color-green)',
            }}
          >
            Token Created Successfully!
          </h4>
          <p
            style={{
              fontSize: '14px',
              marginBottom: '0.75rem',
              color: 'var(--color-brew-black-60)',
            }}
          >
            Make sure to copy your token now. You won&apos;t be able to see it again!
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <code
              style={{
                flex: 1,
                background: 'white',
                padding: '0.5rem',
                borderRadius: '4px',
                fontSize: '13px',
                overflowX: 'auto',
              }}
            >
              {createdToken}
            </code>
            <Button variant="secondary" onClick={() => copyToClipboard(createdToken)}>
              Copy
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={() => setCreatedToken(null)}
            style={{ marginTop: '0.75rem' }}
          >
            I&apos;ve saved my token
          </Button>
        </div>
      )}

      {/* Create token form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateToken}
          style={{
            background: '#f5f5f5',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem' }}>
            Create New API Token
          </h4>

          <Input
            label="Token Name"
            value={formData.tokenName}
            onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
            placeholder="e.g., CI/CD Pipeline, Mobile App"
            required
          />

          <div style={{ marginTop: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '14px',
                marginBottom: '0.5rem',
              }}
            >
              Scopes (Permissions)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Checkbox
                label="Read - View data"
                checked={formData.scopes.read}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scopes: { ...formData.scopes, read: e.target.checked },
                  })
                }
              />
              <Checkbox
                label="Write - Create and update data"
                checked={formData.scopes.write}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scopes: { ...formData.scopes, write: e.target.checked },
                  })
                }
              />
              <Checkbox
                label="Admin - Full administrative access"
                checked={formData.scopes.admin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scopes: { ...formData.scopes, admin: e.target.checked },
                  })
                }
              />
            </div>
          </div>

          <Input
            label="Expires In (Days)"
            type="number"
            value={formData.expiresInDays}
            onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
            placeholder="Optional - leave empty for no expiration"
            style={{ marginTop: '1rem' }}
          />

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <Button type="submit">Create Token</Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Tokens list */}
      {tokens.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--color-brew-black-60)',
          }}
        >
          <p>No API tokens yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tokens.map((token) => (
            <div
              key={token.id}
              style={{
                background: token.is_active ? 'white' : '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {token.token_name}
                    {!token.is_active && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          color: 'var(--color-orange)',
                          fontSize: '14px',
                        }}
                      >
                        (Revoked)
                      </span>
                    )}
                  </h4>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-brew-black-60)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <strong>Scopes:</strong> {token.scopes.join(', ')}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-brew-black-60)' }}>
                    <strong>Created:</strong> {new Date(token.created_at).toLocaleDateString()}
                    {token.last_used_at && (
                      <span style={{ marginLeft: '1rem' }}>
                        <strong>Last used:</strong>{' '}
                        {new Date(token.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                    {token.expires_at && (
                      <span style={{ marginLeft: '1rem' }}>
                        <strong>Expires:</strong> {new Date(token.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {token.is_active && (
                  <Button
                    variant="destructive"
                    onClick={() => handleRevokeToken(token.id, token.token_name)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
