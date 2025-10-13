/**
 * DHCP Range Editor Component
 *
 * Visual editor for setting DHCP range within a subnet with real-time validation
 */
'use client'

import React, { useState, useEffect } from 'react'
import { generateIPsInSubnet, parseCIDRString } from '@/lib/cidr-utils'
import { toast } from 'sonner'

interface DHCPRangeEditorProps {
  networkId: string
  networkAddress: string
  currentDhcpStart?: string | null
  currentDhcpEnd?: string | null
  dhcpEnabled: boolean
  onSave: (start: string, end: string) => Promise<void>
  onToggleDhcp: (enabled: boolean) => Promise<void>
}

interface Conflict {
  ip_address: string
  type: string
  device_name?: string
}

export function DHCPRangeEditor({
  networkId,
  networkAddress,
  currentDhcpStart,
  currentDhcpEnd,
  dhcpEnabled,
  onSave,
  onToggleDhcp,
}: DHCPRangeEditorProps) {
  const [startIP, setStartIP] = useState(currentDhcpStart || '')
  const [endIP, setEndIP] = useState(currentDhcpEnd || '')
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [allIPs, setAllIPs] = useState<string[]>([])
  const [enabled, setEnabled] = useState(dhcpEnabled)

  // Generate IP list from CIDR
  useEffect(() => {
    const parsed = parseCIDRString(networkAddress)
    if (parsed) {
      try {
        const ips = generateIPsInSubnet(parsed.ip, parsed.cidr)
        setAllIPs(ips)
      } catch (err) {
        console.error('Error generating IPs:', err)
      }
    }
  }, [networkAddress])

  // Auto-suggest range (middle 50% of subnet)
  const suggestRange = () => {
    if (allIPs.length > 10) {
      const start = Math.floor(allIPs.length * 0.25)
      const end = Math.floor(allIPs.length * 0.75)
      setStartIP(allIPs[start])
      setEndIP(allIPs[end])
    }
  }

  // Validate range
  const validateRange = async () => {
    if (!startIP || !endIP) {
      setErrors(['Both start and end IP addresses are required'])
      return false
    }

    setValidating(true)
    setErrors([])
    setWarnings([])
    setConflicts([])

    try {
      const response = await fetch(`/api/networks/${networkId}/validate-dhcp-range`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dhcp_range_start: startIP,
          dhcp_range_end: endIP,
        }),
      })

      const result = await response.json()

      if (!result.valid) {
        setErrors(result.errors || [])
        return false
      }

      if (result.warnings) {
        setWarnings(result.warnings)
      }

      if (result.conflicts) {
        setConflicts(result.conflicts)
      }

      return true
    } catch (err) {
      console.error('Validation error:', err)
      setErrors(['Failed to validate DHCP range'])
      return false
    } finally {
      setValidating(false)
    }
  }

  // Handle save
  const handleSave = async () => {
    const isValid = await validateRange()
    if (!isValid) return

    setSaving(true)
    try {
      await onSave(startIP, endIP)
      toast.success('DHCP range updated successfully')
    } catch (err) {
      console.error('Save error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save DHCP range')
    } finally {
      setSaving(false)
    }
  }

  // Handle toggle
  const handleToggle = async () => {
    try {
      await onToggleDhcp(!enabled)
      setEnabled(!enabled)
      toast.success(`DHCP ${!enabled ? 'enabled' : 'disabled'}`)
    } catch (err) {
      console.error('Toggle error:', err)
      toast.error('Failed to toggle DHCP')
    }
  }

  const startIndex = allIPs.indexOf(startIP)
  const endIndex = allIPs.indexOf(endIP)
  const rangeSize = startIndex >= 0 && endIndex >= 0 ? endIndex - startIndex + 1 : 0

  return (
    <div className="dhcp-range-editor">
      <div className="editor-header">
        <h3 className="editor-title">DHCP Configuration</h3>
        <label className="toggle-switch">
          <input type="checkbox" checked={enabled} onChange={handleToggle} />
          <span className="toggle-slider"></span>
          <span className="toggle-label">{enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      {enabled && (
        <>
          <div className="network-info">
            <div className="info-item">
              <span className="info-label">Network:</span>
              <span className="info-value">{networkAddress}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total IPs:</span>
              <span className="info-value">{allIPs.length}</span>
            </div>
            {rangeSize > 0 && (
              <div className="info-item">
                <span className="info-label">DHCP Pool Size:</span>
                <span className="info-value">{rangeSize} IPs</span>
              </div>
            )}
          </div>

          <div className="range-inputs">
            <div className="input-group">
              <label htmlFor="dhcp-start">Start IP</label>
              <input
                id="dhcp-start"
                type="text"
                value={startIP}
                onChange={(e) => setStartIP(e.target.value)}
                placeholder="e.g., 192.168.1.100"
                className="ip-input"
              />
            </div>
            <div className="range-separator">to</div>
            <div className="input-group">
              <label htmlFor="dhcp-end">End IP</label>
              <input
                id="dhcp-end"
                type="text"
                value={endIP}
                onChange={(e) => setEndIP(e.target.value)}
                placeholder="e.g., 192.168.1.200"
                className="ip-input"
              />
            </div>
          </div>

          <div className="editor-actions">
            <button onClick={suggestRange} className="suggest-button" disabled={allIPs.length < 10}>
              Suggest Range
            </button>
            <button
              onClick={validateRange}
              className="validate-button"
              disabled={!startIP || !endIP || validating}
            >
              {validating ? 'Validating...' : 'Validate'}
            </button>
            <button
              onClick={handleSave}
              className="save-button"
              disabled={!startIP || !endIP || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="message-box error-box">
              <strong>Validation Errors:</strong>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="message-box warning-box">
              <strong>Warnings:</strong>
              <ul>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="message-box conflict-box">
              <strong>Conflicting IPs ({conflicts.length}):</strong>
              <div className="conflicts-list">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-item">
                    <span className="conflict-ip">{conflict.ip_address}</span>
                    <span className="conflict-type">{conflict.type}</span>
                    {conflict.device_name && (
                      <span className="conflict-device">{conflict.device_name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .dhcp-range-editor {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid var(--color-brew-black-10);
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .editor-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .toggle-switch {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .toggle-switch input {
          position: absolute;
          opacity: 0;
        }

        .toggle-slider {
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--color-brew-black-20);
          border-radius: 12px;
          transition: background 0.3s;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }

        .toggle-switch input:checked + .toggle-slider {
          background: var(--color-green);
        }

        .toggle-switch input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        .toggle-label {
          font-weight: 500;
          color: var(--color-brew-black);
        }

        .network-info {
          display: flex;
          gap: 2rem;
          padding: 1rem;
          background: var(--color-off-white);
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.85rem;
          color: var(--color-brew-black-60);
        }

        .info-value {
          font-weight: 600;
          font-family: monospace;
          color: var(--color-brew-black);
        }

        .range-inputs {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-brew-black);
        }

        .ip-input {
          padding: 0.75rem;
          border: 1px solid var(--color-brew-black-20);
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.95rem;
        }

        .ip-input:focus {
          outline: none;
          border-color: var(--color-morning-blue);
          box-shadow: 0 0 0 3px rgba(28, 127, 242, 0.1);
        }

        .range-separator {
          padding: 0.75rem 0;
          color: var(--color-brew-black-60);
          font-weight: 500;
        }

        .editor-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .suggest-button,
        .validate-button,
        .save-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .suggest-button {
          background: var(--color-brew-black-10);
          color: var(--color-brew-black);
        }

        .validate-button {
          background: var(--color-light-blue);
          color: var(--color-brew-black);
        }

        .save-button {
          background: var(--color-morning-blue);
          color: white;
        }

        .suggest-button:disabled,
        .validate-button:disabled,
        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .suggest-button:hover:not(:disabled),
        .validate-button:hover:not(:disabled),
        .save-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .message-box {
          padding: 1rem;
          border-radius: 6px;
          margin-top: 1rem;
        }

        .message-box strong {
          display: block;
          margin-bottom: 0.5rem;
        }

        .message-box ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .message-box li {
          margin: 0.25rem 0;
        }

        .error-box {
          background: #fff5f5;
          border: 1px solid var(--color-orange);
          color: var(--color-orange);
        }

        .warning-box {
          background: #fffbf0;
          border: 1px solid var(--color-tangerine);
          color: #8b6914;
        }

        .conflict-box {
          background: #f0f9ff;
          border: 1px solid var(--color-morning-blue);
          color: var(--color-brew-black);
        }

        .conflicts-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .conflict-item {
          display: flex;
          gap: 1rem;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .conflict-ip {
          font-family: monospace;
          font-weight: 600;
          color: var(--color-morning-blue);
        }

        .conflict-type {
          padding: 2px 6px;
          background: var(--color-brew-black-10);
          border-radius: 3px;
          font-size: 0.85em;
          text-transform: capitalize;
        }

        .conflict-device {
          color: var(--color-brew-black-60);
        }
      `}</style>
    </div>
  )
}
