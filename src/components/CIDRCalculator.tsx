/**
 * CIDR Calculator Component
 *
 * Interactive utility for calculating IPv4 subnet information from CIDR notation.
 * Provides network address, broadcast address, usable IP range, host counts, and more.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { calculateCIDR, parseCIDRString, type CIDRCalculation } from '@/lib/cidr-utils'

export interface CIDRCalculatorProps {
  /** Initial CIDR string to populate (e.g., "192.168.1.0/24") */
  initialValue?: string
  /** Callback when "Apply to Network" is clicked */
  onApply?: (calculation: CIDRCalculation) => void
  /** Show/hide the "Apply to Network" button */
  showApplyButton?: boolean
  /** Compact mode for embedding in forms */
  compact?: boolean
}

export function CIDRCalculator({
  initialValue = '',
  onApply,
  showApplyButton = true,
  compact = false,
}: CIDRCalculatorProps) {
  const [cidrInput, setCidrInput] = useState(initialValue)
  const [calculation, setCalculation] = useState<CIDRCalculation | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate on mount if initial value provided
  useEffect(() => {
    if (initialValue) {
      handleCalculate(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCalculate = (input: string = cidrInput) => {
    setError(null)
    setCalculation(null)

    if (!input.trim()) {
      setError('Please enter an IP address in CIDR notation')
      return
    }

    const parsed = parseCIDRString(input)
    if (!parsed) {
      setError('Invalid format. Use CIDR notation like 192.168.1.0/24 or 10.0.0.0/8')
      return
    }

    try {
      const result = calculateCIDR(parsed.ip, parsed.cidr)
      setCalculation(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCidrInput(e.target.value)
    setError(null)
  }

  const handleKeyPress = (e: React.KeyEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCalculate()
    }
  }

  const handleApply = () => {
    if (calculation && onApply) {
      onApply(calculation)
    }
  }

  const handleClear = () => {
    setCidrInput('')
    setCalculation(null)
    setError(null)
  }

  return (
    <div className="cidr-calculator" style={{ width: '100%' }}>
      {/* Input Section */}
      <div className="cidr-calculator__input" style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="cidr-input"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            fontSize: '0.95rem',
            color: 'var(--color-brew-black)',
          }}
        >
          CIDR Notation
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Input
            id="cidr-input"
            type="text"
            value={cidrInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="e.g., 192.168.1.0/24"
            aria-label="CIDR notation input"
            aria-describedby="cidr-help"
            style={{ flex: 1 }}
          />
          <Button onClick={() => handleCalculate()} variant="primary">
            Calculate
          </Button>
          {cidrInput && (
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          )}
        </div>
        <div
          id="cidr-help"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--color-brew-black-60)',
          }}
        >
          Enter an IP address with CIDR notation (e.g., 192.168.1.0/24, 10.0.0.0/8)
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="cidr-calculator__error"
          role="alert"
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#FFF5F5',
            border: '1px solid var(--color-orange)',
            borderRadius: '8px',
            color: 'var(--color-orange)',
            fontSize: '0.9rem',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Section */}
      {calculation && (
        <div
          className="cidr-calculator__results"
          style={{
            border: '1px solid var(--color-brew-black-20)',
            borderRadius: '8px',
            padding: compact ? '1rem' : '1.5rem',
            backgroundColor: 'var(--color-off-white)',
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: '1.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--color-brew-black)',
            }}
          >
            Subnet Information
          </h3>

          <div
            className="cidr-calculator__grid"
            style={{
              display: 'grid',
              gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {/* Network Address */}
            <ResultField label="Network Address" value={calculation.networkAddress} copyable />

            {/* Broadcast Address */}
            <ResultField label="Broadcast Address" value={calculation.broadcastAddress} copyable />

            {/* Usable IP Range */}
            <ResultField
              label="Usable IP Range"
              value={`${calculation.firstUsableIP} - ${calculation.lastUsableIP}`}
              copyable
            />

            {/* Subnet Mask */}
            <ResultField label="Subnet Mask" value={calculation.subnetMask} copyable />

            {/* Wildcard Mask */}
            <ResultField label="Wildcard Mask" value={calculation.wildcardMask} copyable />

            {/* Total Hosts */}
            <ResultField label="Total Hosts" value={calculation.totalHosts.toLocaleString()} />

            {/* Usable Hosts */}
            <ResultField
              label="Usable Hosts"
              value={calculation.usableHosts.toLocaleString()}
              highlight
            />

            {/* CIDR Notation */}
            <ResultField label="CIDR Notation" value={`/${calculation.cidrNotation}`} />

            {/* IP Class */}
            <ResultField label="IP Class" value={`Class ${calculation.ipClass}`} />

            {/* Private/Public */}
            <ResultField
              label="Address Type"
              value={calculation.isPrivate ? 'Private' : 'Public'}
            />

            {/* Binary Subnet Mask */}
            <div
              style={{
                gridColumn: compact ? '1' : '1 / -1',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid var(--color-brew-black-10)',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: 'var(--color-brew-black-60)',
                  marginBottom: '0.5rem',
                }}
              >
                Binary Subnet Mask
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  color: 'var(--color-brew-black)',
                  wordBreak: 'break-all',
                }}
              >
                {calculation.binarySubnetMask}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          {showApplyButton && onApply && (
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <Button onClick={handleApply} variant="primary">
                Apply to Network
              </Button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .cidr-calculator {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  )
}

interface ResultFieldProps {
  label: string
  value: string
  copyable?: boolean
  highlight?: boolean
}

function ResultField({ label, value, copyable = false, highlight = false }: ResultFieldProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!copyable) return

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div
      className="result-field"
      style={{
        padding: '1rem',
        backgroundColor: highlight ? '#E6F3FF' : 'white',
        borderRadius: '6px',
        border: highlight
          ? '2px solid var(--color-morning-blue)'
          : '1px solid var(--color-brew-black-10)',
        position: 'relative',
      }}
    >
      <div
        className="result-field__label"
        style={{
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--color-brew-black-60)',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </div>
      <div
        className="result-field__value"
        style={{
          fontSize: '1rem',
          fontWeight: highlight ? '600' : '500',
          color: highlight ? 'var(--color-morning-blue)' : 'var(--color-brew-black)',
          fontFamily: copyable ? 'monospace' : 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ flex: 1 }}>{value}</span>
        {copyable && (
          <button
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              backgroundColor: copied ? 'var(--color-green)' : 'var(--color-light-blue)',
              color: 'var(--color-brew-black)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}
