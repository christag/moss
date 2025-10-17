/**
 * Admin Page: MCP OAuth Clients Management
 */

'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Icon } from '@/components/ui'

interface OAuthClient {
  id: string
  client_id: string
  client_name: string
  redirect_uris: string[]
  allowed_scopes: string[]
  client_type: 'confidential' | 'public'
  is_active: boolean
  created_at: string
}

export default function MCPAdminPage() {
  const [clients, setClients] = useState<OAuthClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newClientSecret, setNewClientSecret] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    redirect_uris: '',
    allowed_scopes: ['mcp:read', 'mcp:tools', 'mcp:resources', 'mcp:prompts'],
    client_type: 'confidential' as 'confidential' | 'public',
  })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const response = await fetch('/api/admin/mcp/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.clients)
      }
    } catch {
      toast.error('Failed to load OAuth clients')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/mcp/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          redirect_uris: formData.redirect_uris.split('\n').filter((uri) => uri.trim()),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('OAuth client created successfully')
        setNewClientSecret(data.client_secret)
        loadClients()
        setShowCreateForm(false)
      } else {
        toast.error(data.message || 'Failed to create client')
      }
    } catch {
      toast.error('Failed to create OAuth client')
    }
  }

  async function handleDeleteClient(clientId: string) {
    if (
      !confirm('Are you sure you want to delete this OAuth client? All tokens will be revoked.')
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/mcp/clients/${clientId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Client deleted successfully')
        loadClients()
      } else {
        toast.error(data.message || 'Failed to delete client')
      }
    } catch {
      toast.error('Failed to delete client')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brew-black">MCP OAuth Clients</h1>
          <p className="text-brew-black/60 mt-2">
            Manage OAuth 2.1 clients for Model Context Protocol access
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-morning-blue text-white rounded-lg hover:bg-morning-blue/90"
        >
          Create OAuth Client
        </button>
      </div>

      {/* New Client Secret Display */}
      {newClientSecret && (
        <div className="bg-tangerine/10 border border-tangerine p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="alert-warning-triangle" size={20} aria-label="Warning" />
            <h3 className="font-semibold text-brew-black">Save Your Client Secret</h3>
          </div>
          <p className="text-sm text-brew-black/80 mb-3">
            This is the only time you&apos;ll see this secret. Save it securely!
          </p>
          <div className="bg-white p-3 rounded border border-tangerine/30 font-mono text-sm break-all">
            {newClientSecret}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(newClientSecret)
              toast.success('Copied to clipboard')
            }}
            className="mt-3 px-3 py-1 bg-tangerine text-white text-sm rounded hover:bg-tangerine/90"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={() => setNewClientSecret(null)}
            className="mt-3 ml-2 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
            <h2 className="text-2xl font-bold mb-4">Create OAuth Client</h2>
            <form onSubmit={handleCreateClient}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="e.g., Claude Desktop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Redirect URIs (one per line)
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border rounded font-mono text-sm"
                    value={formData.redirect_uris}
                    onChange={(e) => setFormData({ ...formData, redirect_uris: e.target.value })}
                    placeholder="http://localhost:8080/callback"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Allowed Scopes</label>
                  <div className="space-y-2">
                    {['mcp:read', 'mcp:tools', 'mcp:resources', 'mcp:prompts', 'mcp:write'].map(
                      (scope) => (
                        <label key={scope} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.allowed_scopes.includes(scope)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  allowed_scopes: [...formData.allowed_scopes, scope],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  allowed_scopes: formData.allowed_scopes.filter(
                                    (s) => s !== scope
                                  ),
                                })
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{scope}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Client Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={formData.client_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client_type: e.target.value as 'confidential' | 'public',
                      })
                    }
                  >
                    <option value="confidential">Confidential (requires client secret)</option>
                    <option value="public">Public (no client secret)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-morning-blue text-white rounded hover:bg-morning-blue/90"
                >
                  Create Client
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brew-black">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brew-black">
                Client ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brew-black">Scopes</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brew-black">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brew-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-brew-black">{client.client_name}</td>
                <td className="px-6 py-4 text-sm font-mono text-brew-black/80">
                  {client.client_id}
                </td>
                <td className="px-6 py-4 text-xs">
                  {client.allowed_scopes.map((scope) => (
                    <span
                      key={scope}
                      className="inline-block bg-light-blue/20 text-morning-blue px-2 py-1 rounded mr-1 mb-1"
                    >
                      {scope}
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      client.is_active ? 'bg-green/20 text-green' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {client.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-orange hover:text-orange/80 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <div className="text-center py-12 text-brew-black/60">
            No OAuth clients yet. Create one to get started.
          </div>
        )}
      </div>

      <div className="mt-8 bg-light-blue/10 border border-light-blue/30 p-4 rounded-lg">
        <h3 className="font-semibold text-brew-black mb-2">ℹ️ About MCP OAuth Clients</h3>
        <ul className="text-sm text-brew-black/80 space-y-1 list-disc list-inside">
          <li>OAuth clients allow LLMs like Claude to securely access M.O.S.S. via MCP</li>
          <li>Client secrets are only shown once during creation - save them securely</li>
          <li>All OAuth flows use PKCE (Proof Key for Code Exchange) for enhanced security</li>
          <li>Deleting a client will revoke all associated tokens immediately</li>
        </ul>
      </div>
    </div>
  )
}
