/**
 * IP Allocation Wizard Component
 *
 * Multi-step wizard for allocating IP addresses to devices/IOs
 * Steps: 1. Select Network → 2. Show Available IPs → 3. Select IP → 4. Assign to IO → 5. Confirm
 */
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface Network {
  id: string
  network_name: string
  network_address: string
  network_type: string
}

interface AvailableIP {
  ip_address: string
  is_gateway: boolean
  is_broadcast: boolean
}

interface IO {
  id: string
  interface_name: string
  device_id: string
  device_name?: string
}

interface IPAllocationWizardProps {
  onComplete: () => void
  onCancel: () => void
  preselectedNetworkId?: string
}

type WizardStep = 1 | 2 | 3 | 4 | 5

export function IPAllocationWizard({
  onComplete,
  onCancel,
  preselectedNetworkId,
}: IPAllocationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Network selection
  const [networks, setNetworks] = useState<Network[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)

  // Step 2 & 3: Available IPs
  const [availableIPs, setAvailableIPs] = useState<AvailableIP[]>([])
  const [nextAvailableIP, setNextAvailableIP] = useState<string | null>(null)
  const [selectedIP, setSelectedIP] = useState<string>('')

  // Step 4: IO/Device assignment
  const [assignmentType, setAssignmentType] = useState<'io' | 'reserve'>('io')
  const [ios, setIOs] = useState<IO[]>([])
  const [selectedIO, setSelectedIO] = useState<IO | null>(null)
  const [dnsName, setDnsName] = useState('')
  const [hostname, setHostname] = useState('')
  const [notes, setNotes] = useState('')
  const [ipType, setIPType] = useState<'static' | 'dhcp' | 'reserved'>('static')

  // Step 1: Fetch networks
  useEffect(() => {
    fetchNetworks()
  }, [])

  // Auto-select preselected network
  useEffect(() => {
    if (preselectedNetworkId && networks.length > 0) {
      const network = networks.find((n) => n.id === preselectedNetworkId)
      if (network) {
        setSelectedNetwork(network)
      }
    }
  }, [preselectedNetworkId, networks])

  const fetchNetworks = async () => {
    try {
      const response = await fetch('/api/networks?limit=100')
      const result = await response.json()
      if (result.success) {
        setNetworks(result.data)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError('Failed to load networks')
    }
  }

  const fetchAvailableIPs = async (networkId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/networks/${networkId}/available-ips?limit=50`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch available IPs')
      }

      setAvailableIPs(result.data.available_ips)
      setNextAvailableIP(result.data.next_available)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available IPs')
    } finally {
      setLoading(false)
    }
  }

  const fetchIOs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ios?limit=100')
      const result = await response.json()
      if (result.success) {
        setIOs(result.data)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError('Failed to load interfaces')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    setError(null)

    if (currentStep === 1) {
      if (!selectedNetwork) {
        setError('Please select a network')
        return
      }
      await fetchAvailableIPs(selectedNetwork.id)
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!selectedIP) {
        setError('Please select an IP address')
        return
      }
      if (assignmentType === 'io') {
        await fetchIOs()
      }
      setCurrentStep(4)
    } else if (currentStep === 4) {
      if (assignmentType === 'io' && !selectedIO) {
        setError('Please select an interface or choose "Reserve for future use"')
        return
      }
      setCurrentStep(5)
    } else if (currentStep === 5) {
      await handleAllocate()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep)
      setError(null)
    }
  }

  const handleUseNextAvailable = () => {
    if (nextAvailableIP) {
      setSelectedIP(nextAvailableIP)
      setCurrentStep(4)
    }
  }

  const handleAllocate = async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ip_address: selectedIP,
        network_id: selectedNetwork?.id,
        io_id: assignmentType === 'io' ? selectedIO?.id : null,
        type: ipType,
        dns_name: dnsName || null,
        hostname: hostname || null,
        notes: notes || null,
      }

      const response = await fetch('/api/ip-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to allocate IP address')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to allocate IP address')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step">
            <h3 className="step-title">Step 1: Select Network</h3>
            <p className="step-description">Choose the network/subnet to allocate an IP from</p>

            <div className="network-list">
              {networks.map((network) => (
                <div
                  key={network.id}
                  className={`network-card ${selectedNetwork?.id === network.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNetwork(network)}
                >
                  <div className="network-card-header">
                    <span className="network-name">{network.network_name}</span>
                    <Badge variant="info">{network.network_type?.toUpperCase()}</Badge>
                  </div>
                  <div className="network-address">{network.network_address}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="wizard-step">
            <h3 className="step-title">Step 2: Available IPs</h3>
            <p className="step-description">
              Network: <strong>{selectedNetwork?.network_name}</strong> (
              {selectedNetwork?.network_address})
            </p>

            {loading ? (
              <div className="loading">Loading available IPs...</div>
            ) : (
              <>
                {nextAvailableIP && (
                  <div className="next-available-banner">
                    <div className="next-available-content">
                      <div>
                        <strong>Next Available IP:</strong> <code>{nextAvailableIP}</code>
                      </div>
                      <Button onClick={handleUseNextAvailable} variant="primary">
                        Use This IP
                      </Button>
                    </div>
                  </div>
                )}

                <div className="available-ips-info">
                  <strong>{availableIPs.length}</strong> available IPs (excluding allocated,
                  reserved, and DHCP pool)
                </div>
              </>
            )}
          </div>
        )

      case 3:
        return (
          <div className="wizard-step">
            <h3 className="step-title">Step 3: Select IP Address</h3>
            <p className="step-description">
              Choose an IP from the available list or enter manually
            </p>

            <div className="ip-selection">
              <label htmlFor="ip-input" className="input-label">
                IP Address:
              </label>
              <Input
                id="ip-input"
                type="text"
                value={selectedIP}
                onChange={(e) => setSelectedIP(e.target.value)}
                placeholder="e.g., 192.168.1.10"
              />
            </div>

            <div className="available-ips-grid">
              {availableIPs.slice(0, 20).map((ip) => (
                <div
                  key={ip.ip_address}
                  className={`ip-card ${selectedIP === ip.ip_address ? 'selected' : ''}`}
                  onClick={() => setSelectedIP(ip.ip_address)}
                >
                  <code>{ip.ip_address}</code>
                </div>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="wizard-step">
            <h3 className="step-title">Step 4: Assignment Details</h3>
            <p className="step-description">
              Allocating IP: <code>{selectedIP}</code>
            </p>

            <div className="form-group">
              <label className="input-label">Assignment Type:</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="io"
                    checked={assignmentType === 'io'}
                    onChange={() => setAssignmentType('io')}
                  />
                  Assign to Interface
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="reserve"
                    checked={assignmentType === 'reserve'}
                    onChange={() => setAssignmentType('reserve')}
                  />
                  Reserve for future use
                </label>
              </div>
            </div>

            {assignmentType === 'io' && (
              <div className="form-group">
                <label htmlFor="io-select" className="input-label">
                  Select Interface:
                </label>
                <select
                  id="io-select"
                  value={selectedIO?.id || ''}
                  onChange={(e) => {
                    const io = ios.find((i) => i.id === e.target.value)
                    setSelectedIO(io || null)
                  }}
                  className="select-input"
                >
                  <option value="">-- Select Interface --</option>
                  {ios.map((io) => (
                    <option key={io.id} value={io.id}>
                      {io.interface_name} {io.device_name ? `(${io.device_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="ip-type" className="input-label">
                IP Type:
              </label>
              <select
                id="ip-type"
                value={ipType}
                onChange={(e) => setIPType(e.target.value as 'static' | 'dhcp' | 'reserved')}
                className="select-input"
              >
                <option value="static">Static</option>
                <option value="dhcp">DHCP</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dns-name" className="input-label">
                DNS Name (optional):
              </label>
              <Input
                id="dns-name"
                type="text"
                value={dnsName}
                onChange={(e) => setDnsName(e.target.value)}
                placeholder="e.g., server01.example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hostname" className="input-label">
                Hostname (optional):
              </label>
              <Input
                id="hostname"
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="e.g., server01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes" className="input-label">
                Notes (optional):
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                className="textarea-input"
                rows={3}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="wizard-step">
            <h3 className="step-title">Step 5: Confirm Allocation</h3>
            <p className="step-description">
              Review the details below and confirm to allocate the IP address
            </p>

            <div className="confirmation-box">
              <div className="confirmation-row">
                <span className="confirmation-label">Network:</span>
                <span className="confirmation-value">
                  {selectedNetwork?.network_name} ({selectedNetwork?.network_address})
                </span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">IP Address:</span>
                <span className="confirmation-value">
                  <code>{selectedIP}</code>
                </span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">Assignment:</span>
                <span className="confirmation-value">
                  {assignmentType === 'io'
                    ? selectedIO
                      ? `${selectedIO.interface_name} ${selectedIO.device_name ? `(${selectedIO.device_name})` : ''}`
                      : 'No interface selected'
                    : 'Reserved for future use'}
                </span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-label">IP Type:</span>
                <span className="confirmation-value">{ipType.toUpperCase()}</span>
              </div>
              {dnsName && (
                <div className="confirmation-row">
                  <span className="confirmation-label">DNS Name:</span>
                  <span className="confirmation-value">{dnsName}</span>
                </div>
              )}
              {hostname && (
                <div className="confirmation-row">
                  <span className="confirmation-label">Hostname:</span>
                  <span className="confirmation-value">{hostname}</span>
                </div>
              )}
              {notes && (
                <div className="confirmation-row">
                  <span className="confirmation-label">Notes:</span>
                  <span className="confirmation-value">{notes}</span>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="ip-allocation-wizard">
      {/* Progress Bar */}
      <div className="wizard-progress">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
            <div className="progress-circle">{step}</div>
            <div className="progress-label">
              {step === 1 && 'Network'}
              {step === 2 && 'Available'}
              {step === 3 && 'Select IP'}
              {step === 4 && 'Details'}
              {step === 5 && 'Confirm'}
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="wizard-error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step Content */}
      <div className="wizard-content">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="wizard-actions">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <div className="wizard-actions-right">
          {currentStep > 1 && (
            <Button onClick={handleBack} variant="outline" disabled={loading}>
              Back
            </Button>
          )}
          <Button onClick={handleNext} variant="primary" disabled={loading}>
            {loading ? 'Processing...' : currentStep === 5 ? 'Allocate IP' : 'Next'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .ip-allocation-wizard {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .wizard-progress {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          position: relative;
        }

        .wizard-progress::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-brew-black-20);
          z-index: 0;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          z-index: 1;
        }

        .progress-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--color-brew-black-20);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--color-brew-black-60);
          transition: all 0.3s;
        }

        .progress-step.active .progress-circle {
          background: var(--color-morning-blue);
          border-color: var(--color-morning-blue);
          color: white;
        }

        .progress-label {
          font-size: 0.85rem;
          color: var(--color-brew-black-60);
          font-weight: 500;
        }

        .progress-step.active .progress-label {
          color: var(--color-morning-blue);
          font-weight: 600;
        }

        .wizard-error {
          padding: 1rem;
          margin-bottom: 2rem;
          background: #fff5f5;
          border: 1px solid var(--color-orange);
          border-radius: 8px;
          color: var(--color-orange);
        }

        .wizard-content {
          min-height: 400px;
          margin-bottom: 2rem;
        }

        .wizard-step {
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .step-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .step-description {
          margin: 0 0 2rem 0;
          font-size: 1rem;
          color: var(--color-brew-black-60);
        }

        .network-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .network-card {
          padding: 1rem;
          background: white;
          border: 2px solid var(--color-brew-black-20);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .network-card:hover {
          border-color: var(--color-morning-blue);
        }

        .network-card.selected {
          border-color: var(--color-morning-blue);
          background: #e6f3ff;
        }

        .network-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .network-name {
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .network-address {
          font-family: monospace;
          color: var(--color-brew-black-60);
        }

        .next-available-banner {
          padding: 1rem;
          background: var(--color-light-blue);
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .next-available-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .available-ips-info {
          padding: 1rem;
          background: var(--color-off-white);
          border-radius: 8px;
          color: var(--color-brew-black);
          margin-bottom: 1.5rem;
        }

        .ip-selection {
          margin-bottom: 2rem;
        }

        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-brew-black);
        }

        .available-ips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
        }

        .ip-card {
          padding: 0.75rem;
          background: white;
          border: 2px solid var(--color-brew-black-20);
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ip-card:hover {
          border-color: var(--color-morning-blue);
        }

        .ip-card.selected {
          border-color: var(--color-morning-blue);
          background: #e6f3ff;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .radio-group {
          display: flex;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .select-input,
        .textarea-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--color-brew-black-20);
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .textarea-input {
          resize: vertical;
          font-family: inherit;
        }

        .confirmation-box {
          padding: 1.5rem;
          background: var(--color-off-white);
          border-radius: 8px;
          border: 1px solid var(--color-brew-black-20);
        }

        .confirmation-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--color-brew-black-10);
        }

        .confirmation-row:last-child {
          border-bottom: none;
        }

        .confirmation-label {
          font-weight: 600;
          color: var(--color-brew-black-60);
        }

        .confirmation-value {
          color: var(--color-brew-black);
          font-weight: 500;
        }

        .wizard-actions {
          display: flex;
          justify-content: space-between;
          padding-top: 2rem;
          border-top: 1px solid var(--color-brew-black-20);
        }

        .wizard-actions-right {
          display: flex;
          gap: 1rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: var(--color-brew-black-60);
        }

        code {
          font-family: monospace;
          background: var(--color-brew-black-10);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
