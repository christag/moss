/**
 * IP Address Conflicts Page
 *
 * Displays detected IP conflicts with filtering and resolution actions
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface DuplicateIPConflict {
  type: 'duplicate'
  ip_address: string
  conflict_count: number
  assignments: Array<{
    ip_id: string
    io_id: string
    device_id: string | null
    device_name: string | null
    network_id: string
    network_name: string
  }>
}

interface OutOfRangeConflict {
  type: 'out_of_range'
  ip_id: string
  ip_address: string
  network_id: string
  network_name: string
  network_address: string
  device_id: string | null
  device_name: string | null
}

interface DHCPConflict {
  type: 'dhcp'
  ip_id: string
  ip_address: string
  network_id: string
  network_name: string
  dhcp_range_start: string
  dhcp_range_end: string
  device_id: string | null
  device_name: string | null
  assignment_type: string
}

type IPConflict = DuplicateIPConflict | OutOfRangeConflict | DHCPConflict

interface ConflictsSummary {
  total_conflicts: number
  duplicate_count: number
  out_of_range_count: number
  dhcp_conflict_count: number
}

export default function IPConflictsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conflicts, setConflicts] = useState<IPConflict[]>([])
  const [filteredConflicts, setFilteredConflicts] = useState<IPConflict[]>([])
  const [summary, setSummary] = useState<ConflictsSummary>({
    total_conflicts: 0,
    duplicate_count: 0,
    out_of_range_count: 0,
    dhcp_conflict_count: 0,
  })
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchConflicts()
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflicts, filterType, searchTerm])

  const fetchConflicts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ip-addresses/conflicts')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch conflicts')
      }

      setConflicts(result.data.conflicts)
      setSummary(result.data.summary)
    } catch (error) {
      console.error('Error fetching conflicts:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = conflicts

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((c) => c.type === filterType)
    }

    // Filter by search term (IP address, device name, network name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((c) => {
        const ipMatch = c.ip_address?.toLowerCase().includes(term)
        const networkMatch = c.network_name?.toLowerCase().includes(term)
        const deviceMatch = 'device_name' in c && c.device_name?.toLowerCase().includes(term)
        return ipMatch || networkMatch || deviceMatch
      })
    }

    setFilteredConflicts(filtered)
  }

  const getConflictTypeBadge = (type: string) => {
    switch (type) {
      case 'duplicate':
        return <Badge variant="error">Duplicate</Badge>
      case 'out_of_range':
        return <Badge variant="warning">Out of Range</Badge>
      case 'dhcp':
        return <Badge variant="warning">DHCP Conflict</Badge>
      default:
        return <Badge variant="default">{type}</Badge>
    }
  }

  const renderConflictRow = (conflict: IPConflict, index: number) => {
    switch (conflict.type) {
      case 'duplicate':
        return (
          <tr key={`duplicate-${index}`} className="conflict-row">
            <td className="conflict-cell">{getConflictTypeBadge(conflict.type)}</td>
            <td className="conflict-cell">
              <span className="conflict-ip">{conflict.ip_address}</span>
            </td>
            <td className="conflict-cell">
              <Badge variant="error">{conflict.conflict_count} assignments</Badge>
            </td>
            <td className="conflict-cell">
              <div className="conflict-details">
                {conflict.assignments.map((assignment, idx) => (
                  <div key={idx} className="conflict-assignment">
                    <span className="conflict-device">
                      {assignment.device_name || 'Unknown Device'}
                    </span>
                    {' on '}
                    <span className="conflict-network">{assignment.network_name}</span>
                  </div>
                ))}
              </div>
            </td>
            <td className="conflict-cell">
              <div className="conflict-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    conflict.assignments[0]?.device_id &&
                    router.push(`/devices/${conflict.assignments[0].device_id}`)
                  }
                >
                  View Devices
                </Button>
              </div>
            </td>
          </tr>
        )

      case 'out_of_range':
        return (
          <tr key={`out_of_range-${conflict.ip_id}`} className="conflict-row">
            <td className="conflict-cell">{getConflictTypeBadge(conflict.type)}</td>
            <td className="conflict-cell">
              <span className="conflict-ip">{conflict.ip_address}</span>
            </td>
            <td className="conflict-cell">Not in subnet {conflict.network_address}</td>
            <td className="conflict-cell">
              <span className="conflict-device">{conflict.device_name || 'Unknown Device'}</span>
              {' on '}
              <span className="conflict-network">{conflict.network_name}</span>
            </td>
            <td className="conflict-cell">
              <div className="conflict-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/ip-addresses/${conflict.ip_id}/edit`)}
                >
                  Edit IP
                </Button>
                {conflict.device_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/devices/${conflict.device_id}`)}
                  >
                    View Device
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )

      case 'dhcp':
        return (
          <tr key={`dhcp-${conflict.ip_id}`} className="conflict-row">
            <td className="conflict-cell">{getConflictTypeBadge(conflict.type)}</td>
            <td className="conflict-cell">
              <span className="conflict-ip">{conflict.ip_address}</span>
            </td>
            <td className="conflict-cell">
              Static IP in DHCP range ({conflict.dhcp_range_start} - {conflict.dhcp_range_end})
            </td>
            <td className="conflict-cell">
              <span className="conflict-device">{conflict.device_name || 'Unknown Device'}</span>
              {' on '}
              <span className="conflict-network">{conflict.network_name}</span>
            </td>
            <td className="conflict-cell">
              <div className="conflict-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/ip-addresses/${conflict.ip_id}/edit`)}
                >
                  Edit IP
                </Button>
                {conflict.device_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/devices/${conflict.device_id}`)}
                  >
                    View Device
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner">Loading conflicts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">IP Address Conflicts</h1>
          <p className="page-subtitle">
            Detect and resolve duplicate IPs, out-of-range assignments, and DHCP conflicts
          </p>
        </div>
        <div className="page-header-right">
          <Button variant="outline" onClick={fetchConflicts}>
            Refresh
          </Button>
          <Button variant="outline" onClick={() => router.push('/ip-addresses')}>
            Back to IP Addresses
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">Total Conflicts</div>
          <div className="summary-card-value" style={{ color: 'var(--color-orange)' }}>
            {summary.total_conflicts}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Duplicate IPs</div>
          <div className="summary-card-value" style={{ color: 'var(--color-orange)' }}>
            {summary.duplicate_count}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Out of Range</div>
          <div className="summary-card-value" style={{ color: 'var(--color-tangerine)' }}>
            {summary.out_of_range_count}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">DHCP Conflicts</div>
          <div className="summary-card-value" style={{ color: 'var(--color-tangerine)' }}>
            {summary.dhcp_conflict_count}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="filter-type" className="filter-label">
            Conflict Type:
          </label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="duplicate">Duplicate IPs</option>
            <option value="out_of_range">Out of Range</option>
            <option value="dhcp">DHCP Conflicts</option>
          </select>
        </div>
        <div className="filter-group">
          <Input
            type="text"
            placeholder="Search IP, device, or network..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '300px' }}
          />
        </div>
      </div>

      {/* Conflicts Table */}
      {filteredConflicts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✓</div>
          <h2 className="empty-state-title">
            {conflicts.length === 0 ? 'No Conflicts Detected' : 'No Matching Conflicts'}
          </h2>
          <p className="empty-state-message">
            {conflicts.length === 0
              ? 'All IP addresses are properly configured with no conflicts.'
              : 'Try adjusting your filters to see more results.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="conflicts-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>IP Address</th>
                <th>Issue</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConflicts.map((conflict, index) => renderConflictRow(conflict, index))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .page-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .page-header-left {
          flex: 1;
        }

        .page-header-right {
          display: flex;
          gap: 1rem;
        }

        .page-title {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .page-subtitle {
          margin: 0;
          font-size: 1rem;
          color: var(--color-brew-black-60);
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          border: 1px solid var(--color-brew-black-10);
        }

        .summary-card-label {
          font-size: 0.9rem;
          color: var(--color-brew-black-60);
          margin-bottom: 0.5rem;
        }

        .summary-card-value {
          font-size: 2rem;
          font-weight: 600;
        }

        .filters-container {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--color-off-white);
          border-radius: 8px;
          border: 1px solid var(--color-brew-black-20);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filter-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-brew-black);
          white-space: nowrap;
        }

        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-brew-black-20);
          border-radius: 6px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
        }

        .table-container {
          background: white;
          border-radius: 8px;
          border: 1px solid var(--color-brew-black-10);
          overflow: hidden;
        }

        .conflicts-table {
          width: 100%;
          border-collapse: collapse;
        }

        .conflicts-table thead {
          background: var(--color-off-white);
          border-bottom: 2px solid var(--color-brew-black-10);
        }

        .conflicts-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--color-brew-black);
        }

        .conflict-row {
          border-bottom: 1px solid var(--color-brew-black-10);
        }

        .conflict-row:hover {
          background: var(--color-off-white);
        }

        .conflict-cell {
          padding: 1rem;
          vertical-align: top;
        }

        .conflict-ip {
          font-family: monospace;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .conflict-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .conflict-assignment {
          font-size: 0.9rem;
          color: var(--color-brew-black-60);
        }

        .conflict-device {
          font-weight: 500;
          color: var(--color-brew-black);
        }

        .conflict-network {
          color: var(--color-morning-blue);
        }

        .conflict-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 8px;
          border: 1px solid var(--color-brew-black-10);
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          color: var(--color-green);
        }

        .empty-state-title {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .empty-state-message {
          margin: 0;
          font-size: 1rem;
          color: var(--color-brew-black-60);
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .loading-spinner {
          font-size: 1.2rem;
          color: var(--color-brew-black-60);
        }
      `}</style>
    </div>
  )
}
