/**
 * Permission Testing Page
 * Debug tool for testing permission checks
 */

'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'

interface TestResult {
  granted: boolean
  reason: string
  path?: string[]
  test_parameters: {
    user_id: string
    action: string
    object_type: string
    object_id: string | null
  }
}

export default function PermissionTestPage() {
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState<'view' | 'edit' | 'delete' | 'manage_permissions'>('view')
  const [objectType, setObjectType] = useState('device')
  const [objectId, setObjectId] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const objectTypes = [
    'company',
    'location',
    'room',
    'person',
    'device',
    'io',
    'ip_address',
    'network',
    'software',
    'saas_service',
    'installed_application',
    'software_license',
    'document',
    'external_document',
    'contract',
    'group',
  ]

  const handleTest = async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setTesting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/rbac/test-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action,
          object_type: objectType,
          object_id: objectId || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.message || 'Test failed')
      }
    } catch (err) {
      setError('An error occurred while testing permission')
      console.error(err)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
        Permission Testing
      </h1>
      <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-xl)' }}>
        Test permission checks for debugging and troubleshooting
      </p>

      {/* Test Form */}
      <div
        style={{
          backgroundColor: 'var(--color-off-white)',
          padding: 'var(--spacing-xl)',
          borderRadius: '8px',
          border: '1px solid var(--color-brew-black-20)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
          Test Parameters
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
          {/* User ID */}
          <div>
            <label
              htmlFor="user_id"
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              User ID *
            </label>
            <Input
              id="user_id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID of user to test"
            />
            <p
              style={{
                color: 'var(--color-brew-black-60)',
                fontSize: '0.875rem',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              The UUID of the user whose permissions you want to test
            </p>
          </div>

          {/* Action */}
          <div>
            <label
              htmlFor="action"
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              Action *
            </label>
            <select
              id="action"
              value={action}
              onChange={(e) =>
                setAction(e.target.value as 'view' | 'edit' | 'delete' | 'manage_permissions')
              }
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-brew-black-20)',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'var(--color-off-white)',
              }}
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
              <option value="delete">Delete</option>
              <option value="manage_permissions">Manage Permissions</option>
            </select>
          </div>

          {/* Object Type */}
          <div>
            <label
              htmlFor="object_type"
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              Object Type *
            </label>
            <select
              id="object_type"
              value={objectType}
              onChange={(e) => setObjectType(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-brew-black-20)',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'var(--color-off-white)',
              }}
            >
              {objectTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Object ID (Optional) */}
          <div>
            <label
              htmlFor="object_id"
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              Object ID (Optional)
            </label>
            <Input
              id="object_id"
              type="text"
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
              placeholder="UUID of specific object"
            />
            <p
              style={{
                color: 'var(--color-brew-black-60)',
                fontSize: '0.875rem',
                marginTop: 'var(--spacing-xs)',
              }}
            >
              Leave empty to test general permission, or provide UUID to test object-level
              permission
            </p>
          </div>
        </div>

        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <Button variant="primary" onClick={handleTest} disabled={testing || !userId}>
            {testing ? 'Testing...' : 'Test Permission'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-brew-black)',
            padding: 'var(--spacing-lg)',
            borderRadius: '8px',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Test Results */}
      {result && (
        <div
          style={{
            backgroundColor: 'var(--color-off-white)',
            padding: 'var(--spacing-xl)',
            borderRadius: '8px',
            border: `2px solid ${result.granted ? 'var(--color-green)' : 'var(--color-orange)'}`,
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
            Test Results
          </h2>

          {/* Permission Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                color: result.granted ? 'var(--color-green)' : 'var(--color-orange)',
              }}
            >
              {result.granted ? '✅' : '❌'}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                {result.granted ? 'Permission Granted' : 'Permission Denied'}
              </div>
              <div style={{ color: 'var(--color-brew-black-60)' }}>{result.reason}</div>
            </div>
          </div>

          {/* Permission Path */}
          {result.path && result.path.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                Permission Path
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                {result.path.map((step, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        backgroundColor: 'var(--color-morning-blue)',
                        color: 'var(--color-off-white)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                      }}
                    >
                      {step}
                    </div>
                    {index < result.path!.length - 1 && (
                      <span
                        style={{
                          margin: '0 var(--spacing-sm)',
                          color: 'var(--color-brew-black-60)',
                        }}
                      >
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Parameters */}
          <div>
            <h3 style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
              Test Parameters
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--spacing-md)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  User ID
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {result.test_parameters.user_id}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Action
                </div>
                <div style={{ textTransform: 'capitalize' }}>{result.test_parameters.action}</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Object Type
                </div>
                <div style={{ textTransform: 'capitalize' }}>
                  {result.test_parameters.object_type.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-brew-black-60)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Object ID
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {result.test_parameters.object_id || 'None (general permission)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div
        style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-light-blue)',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>How to Use</h3>
        <ul style={{ marginLeft: 'var(--spacing-lg)', lineHeight: 1.8 }}>
          <li>Enter the UUID of the user you want to test permissions for</li>
          <li>Select the action they want to perform (view, edit, delete, manage permissions)</li>
          <li>Select the object type they want to access</li>
          <li>
            Optionally provide a specific object ID to test object-level permissions (otherwise
            tests general role permissions)
          </li>
          <li>Click &quot;Test Permission&quot; to see if the permission would be granted</li>
          <li>The result will show whether permission is granted and explain why</li>
        </ul>
      </div>
    </div>
  )
}
