'use client'

/**
 * API Token Management Page
 *
 * Allows users to:
 * - View their active API tokens
 * - Create new tokens with custom scopes
 * - Revoke existing tokens
 * - See usage statistics
 */

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'

interface ApiToken {
  id: string
  token_name: string
  token_prefix: string
  scopes: string[]
  last_used_at: string | null
  last_used_ip: string | null
  usage_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface NewTokenResponse {
  success: boolean
  token: string
  tokenId: string
  tokenPrefix: string
  createdAt: string
  expiresAt: string | null
  scopes: string[]
  warning: string
  message?: string
}

export default function ApiTokensPage() {
  const { data: session } = useSession()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // New token form state
  const [tokenName, setTokenName] = useState('')
  const [scopeRead, setScopeRead] = useState(true)
  const [scopeWrite, setScopeWrite] = useState(false)
  const [scopeAdmin, setScopeAdmin] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState<string>('90')

  // New token display state
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTokens()
  }, [])

  async function fetchTokens() {
    try {
      setLoading(true)
      const response = await fetch('/api/api-tokens')
      const data = await response.json()

      if (data.success) {
        setTokens(data.tokens)
      } else {
        setError(data.message || 'Failed to fetch tokens')
      }
    } catch (err) {
      setError('Failed to fetch tokens')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function createToken() {
    try {
      setCreating(true)
      setError(null)

      const scopes: string[] = []
      if (scopeRead) scopes.push('read')
      if (scopeWrite) scopes.push('write')
      if (scopeAdmin) scopes.push('admin')

      if (scopes.length === 0) {
        setError('Please select at least one scope')
        setCreating(false)
        return
      }

      const response = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName,
          scopes,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        }),
      })

      const data: NewTokenResponse = await response.json()

      if (data.success) {
        setNewToken(data.token)
        setShowCreateForm(false)
        fetchTokens() // Refresh list
      } else {
        setError(data.message || 'Failed to create token')
      }
    } catch (err) {
      setError('Failed to create token')
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  async function revokeToken(tokenId: string, tokenName: string) {
    if (
      !confirm(`Are you sure you want to revoke the token "${tokenName}"? This cannot be undone.`)
    ) {
      return
    }

    try {
      const response = await fetch(`/api/api-tokens/${tokenId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchTokens() // Refresh list
      } else {
        setError(data.message || 'Failed to revoke token')
      }
    } catch (err) {
      setError('Failed to revoke token')
      console.error(err)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function resetCreateForm() {
    setTokenName('')
    setScopeRead(true)
    setScopeWrite(false)
    setScopeAdmin(false)
    setExpiresInDays('90')
    setShowCreateForm(false)
    setError(null)
  }

  function closeNewTokenModal() {
    setNewToken(null)
    setCopied(false)
  }

  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          Home
        </Link>
        {' / '}
        <span>Settings</span>
        {' / '}
        <span className="font-semibold">API Tokens</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Tokens</h1>
          <p className="text-gray-600">
            Create and manage API tokens for programmatic access to the M.O.S.S. API
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
          Create New Token
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* New Token Display Modal */}
      {newToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Token Created Successfully!</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
              <p className="font-semibold text-yellow-800 mb-2">
                ⚠️ Important: Copy this token now
              </p>
              <p className="text-sm text-yellow-700">
                This token will only be shown once. If you lose it, you&apos;ll need to create a new
                token.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your API Token:</label>
              <div className="flex gap-2">
                <Input value={newToken} readOnly className="font-mono text-sm flex-1" />
                <Button
                  variant={copied ? 'secondary' : 'primary'}
                  onClick={() => copyToClipboard(newToken)}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="text-sm font-medium mb-2">Usage Example:</p>
              <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                {`curl -H "Authorization: Bearer ${newToken}" \\
  https://moss.example.com/api/devices`}
              </pre>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={closeNewTokenModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Token Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Create New API Token</h2>

          <div className="space-y-4">
            <Input
              label="Token Name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g., Production Server, Mobile App"
              helperText="A descriptive name to identify this token"
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">Scopes (Permissions)</label>
              <div className="space-y-2">
                <Checkbox
                  label="Read - View data (GET requests)"
                  checked={scopeRead}
                  onChange={(e) => setScopeRead(e.target.checked)}
                />
                <Checkbox
                  label="Write - Create and update data (POST, PUT, PATCH requests)"
                  checked={scopeWrite}
                  onChange={(e) => setScopeWrite(e.target.checked)}
                />
                {isAdmin && (
                  <Checkbox
                    label="Admin - Administrative operations (DELETE requests, admin endpoints)"
                    checked={scopeAdmin}
                    onChange={(e) => setScopeAdmin(e.target.checked)}
                    helperText="Only available for admin users"
                  />
                )}
              </div>
            </div>

            <Select
              label="Expiration"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              options={[
                { value: '30', label: '30 days' },
                { value: '60', label: '60 days' },
                { value: '90', label: '90 days (recommended)' },
                { value: '180', label: '180 days' },
                { value: '365', label: '1 year' },
                { value: '', label: 'Never (not recommended)' },
              ]}
              helperText="Tokens automatically expire for security. You can revoke them manually anytime."
            />

            <div className="flex gap-2 pt-4">
              <Button
                variant="primary"
                onClick={createToken}
                disabled={creating || !tokenName.trim()}
              >
                {creating ? 'Creating...' : 'Create Token'}
              </Button>
              <Button variant="secondary" onClick={resetCreateForm}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tokens List */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Token Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Prefix</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Scopes</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Last Used</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Expires</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Loading tokens...
                </td>
              </tr>
            ) : tokens.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No API tokens yet. Create one to get started!
                </td>
              </tr>
            ) : (
              tokens.map((token) => (
                <tr key={token.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{token.token_name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">
                    {token.token_prefix}...
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {token.scopes.map((scope) => (
                        <span
                          key={scope}
                          className={`px-2 py-0.5 text-xs rounded ${
                            scope === 'admin'
                              ? 'bg-orange-100 text-orange-800'
                              : scope === 'write'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {token.last_used_at ? (
                      <div>
                        <div>{new Date(token.last_used_at).toLocaleDateString()}</div>
                        {token.last_used_ip && (
                          <div className="text-xs text-gray-500">{token.last_used_ip}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Never used</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{token.usage_count} calls</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {token.expires_at ? (
                      <span
                        className={
                          new Date(token.expires_at) < new Date()
                            ? 'text-red-600'
                            : new Date(token.expires_at).getTime() - Date.now() <
                                7 * 24 * 60 * 60 * 1000
                              ? 'text-yellow-600'
                              : ''
                        }
                      >
                        {new Date(token.expires_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        token.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {token.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {token.is_active && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeToken(token.id, token.token_name)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Documentation */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-2">API Documentation</h3>
        <p className="text-sm text-gray-700 mb-4">
          To use your API tokens, include them in the Authorization header of your HTTP requests:
        </p>
        <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto mb-4">
          {`curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  https://moss.example.com/api/devices`}
        </pre>
        <p className="text-sm text-gray-700">
          For full API documentation, see{' '}
          <Link href="/api/docs" className="text-blue-600 hover:underline font-medium">
            API Documentation
          </Link>
        </p>
      </div>
    </div>
  )
}
