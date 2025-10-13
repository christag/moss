/**
 * Subnet Visualization Component
 *
 * Interactive grid-based visualization of IP addresses within a subnet.
 * Shows allocation status with color coding and interactive tooltips.
 */
'use client'

import React, { useState, useEffect } from 'react'

interface IPAllocation {
  ip_address: string
  status: 'allocated' | 'reserved' | 'dhcp' | 'available'
  io_id?: string
  device_id?: string
  device_name?: string
  dns_name?: string
  type?: string
  assignment_date?: string
}

interface SubnetInfo {
  network_address: string
  broadcast_address: string
  cidr_notation: number
  subnet_mask: string
  first_usable_ip: string
  last_usable_ip: string
  total_hosts: number
  usable_hosts: number
  allocated_count: number
  reserved_count: number
  dhcp_count: number
  available_count: number
  utilization_percent: number
}

interface SubnetVisualizationProps {
  networkId: string
}

export function SubnetVisualization({ networkId }: SubnetVisualizationProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subnetInfo, setSubnetInfo] = useState<SubnetInfo | null>(null)
  const [ipAllocations, setIPAllocations] = useState<IPAllocation[]>([])
  const [selectedIP, setSelectedIP] = useState<IPAllocation | null>(null)

  useEffect(() => {
    fetchIPUtilization()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId])

  const fetchIPUtilization = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/networks/${networkId}/ip-utilization`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch IP utilization')
      }

      setSubnetInfo(result.data.subnet_info)
      setIPAllocations(result.data.ip_allocations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleIPClick = (ip: IPAllocation) => {
    setSelectedIP(ip)
  }

  const handleCloseModal = () => {
    setSelectedIP(null)
  }

  const getStatusColor = (status: IPAllocation['status']): string => {
    switch (status) {
      case 'allocated':
        return 'var(--color-green)' // Green
      case 'reserved':
        return 'var(--color-morning-blue)' // Morning Blue
      case 'dhcp':
        return 'var(--color-tangerine)' // Tangerine/Yellow
      case 'available':
        return 'var(--color-brew-black-20)' // Gray
      default:
        return 'var(--color-brew-black-20)'
    }
  }

  // Determine grid layout based on subnet size
  const getGridDimensions = (cidr: number): { cols: number; rows: number } => {
    const hostCount = Math.pow(2, 32 - cidr)

    if (cidr === 24) return { cols: 16, rows: 16 } // 256 hosts
    if (cidr === 25) return { cols: 16, rows: 8 } // 128 hosts
    if (cidr === 26) return { cols: 8, rows: 8 } // 64 hosts
    if (cidr === 27) return { cols: 8, rows: 4 } // 32 hosts
    if (cidr === 28) return { cols: 4, rows: 4 } // 16 hosts
    if (cidr === 29) return { cols: 4, rows: 2 } // 8 hosts
    if (cidr === 30) return { cols: 2, rows: 2 } // 4 hosts
    if (cidr === 31) return { cols: 2, rows: 1 } // 2 hosts
    if (cidr === 32) return { cols: 1, rows: 1 } // 1 host

    // Fallback for larger subnets (shouldn't happen due to API restrictions)
    return { cols: 16, rows: Math.ceil(hostCount / 16) }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: 'var(--color-brew-black-60)' }}>
          Loading subnet visualization...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#FFF5F5',
          border: '1px solid var(--color-orange)',
          borderRadius: '8px',
          color: 'var(--color-orange)',
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    )
  }

  if (!subnetInfo || ipAllocations.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: 'var(--color-brew-black-60)' }}>
          No IP allocation data available.
        </div>
      </div>
    )
  }

  const gridDimensions = getGridDimensions(subnetInfo.cidr_notation)

  return (
    <div className="subnet-visualization" style={{ width: '100%' }}>
      {/* Stats Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          label="Network"
          value={`${subnetInfo.network_address}/${subnetInfo.cidr_notation}`}
          color="var(--color-morning-blue)"
        />
        <StatCard
          label="Utilization"
          value={`${subnetInfo.utilization_percent}%`}
          color={subnetInfo.utilization_percent > 80 ? 'var(--color-orange)' : 'var(--color-green)'}
        />
        <StatCard
          label="Allocated"
          value={`${subnetInfo.allocated_count}/${subnetInfo.usable_hosts}`}
          color="var(--color-green)"
        />
        <StatCard
          label="DHCP Pool"
          value={subnetInfo.dhcp_count.toString()}
          color="var(--color-tangerine)"
        />
        <StatCard
          label="Available"
          value={subnetInfo.available_count.toString()}
          color="var(--color-brew-black-60)"
        />
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          padding: '1rem',
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '8px',
          border: '1px solid var(--color-brew-black-20)',
        }}
      >
        <LegendItem color={getStatusColor('allocated')} label="Allocated" />
        <LegendItem color={getStatusColor('reserved')} label="Reserved" />
        <LegendItem color={getStatusColor('dhcp')} label="DHCP Pool" />
        <LegendItem color={getStatusColor('available')} label="Available" />
      </div>

      {/* IP Grid */}
      <div
        className="ip-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
          gap: '4px',
          padding: '1rem',
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '8px',
          border: '1px solid var(--color-brew-black-20)',
        }}
      >
        {ipAllocations.map((ip) => (
          <IPCell
            key={ip.ip_address}
            ip={ip}
            onClick={() => handleIPClick(ip)}
            color={getStatusColor(ip.status)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedIP && (
        <IPDetailModal ip={selectedIP} subnetInfo={subnetInfo} onClose={handleCloseModal} />
      )}

      <style jsx>{`
        .subnet-visualization {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  color: string
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid var(--color-brew-black-10)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--color-brew-black-60)',
          marginBottom: '0.5rem',
          fontWeight: '500',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

interface LegendItemProps {
  color: string
  label: string
}

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: color,
          borderRadius: '4px',
          border: '1px solid var(--color-brew-black-20)',
        }}
      />
      <span style={{ fontSize: '0.9rem', color: 'var(--color-brew-black)' }}>{label}</span>
    </div>
  )
}

interface IPCellProps {
  ip: IPAllocation
  onClick: () => void
  color: string
}

function IPCell({ ip, onClick, color }: IPCellProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Extract last octet for display
  const lastOctet = ip.ip_address.split('.')[3]

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`IP ${ip.ip_address}: ${ip.status}`}
      style={{
        aspectRatio: '1',
        backgroundColor: color,
        border: isHovered
          ? '2px solid var(--color-brew-black)'
          : '1px solid var(--color-brew-black-20)',
        borderRadius: '4px',
        cursor: ip.status === 'allocated' || ip.status === 'reserved' ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: '500',
        color:
          ip.status === 'available' || ip.status === 'dhcp'
            ? 'var(--color-brew-black-60)'
            : 'white',
        transition: 'all 0.2s',
        position: 'relative',
        padding: '4px',
        minHeight: '32px',
        minWidth: '32px',
      }}
      title={`${ip.ip_address}\n${ip.device_name || ip.dns_name || ''}\nStatus: ${ip.status}`}
    >
      <span style={{ fontSize: '0.7rem' }}>{lastOctet}</span>
    </button>
  )
}

interface IPDetailModalProps {
  ip: IPAllocation
  subnetInfo: SubnetInfo
  onClose: () => void
}

function IPDetailModal({ ip, subnetInfo, onClose }: IPDetailModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-brew-black)' }}>
            {ip.ip_address}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--color-brew-black-60)',
              padding: '0',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <DetailRow
            label="Status"
            value={ip.status.charAt(0).toUpperCase() + ip.status.slice(1)}
          />

          {ip.device_name && <DetailRow label="Device" value={ip.device_name} />}

          {ip.dns_name && <DetailRow label="DNS Name" value={ip.dns_name} />}

          {ip.type && <DetailRow label="Type" value={ip.type.toUpperCase()} />}

          {ip.assignment_date && (
            <DetailRow
              label="Assignment Date"
              value={new Date(ip.assignment_date).toLocaleDateString()}
            />
          )}

          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--color-brew-black-20)',
              margin: '0.5rem 0',
            }}
          />

          <DetailRow
            label="Subnet"
            value={`${subnetInfo.network_address}/${subnetInfo.cidr_notation}`}
          />
          <DetailRow label="Subnet Mask" value={subnetInfo.subnet_mask} />
          <DetailRow label="Gateway" value={subnetInfo.first_usable_ip} />
        </div>

        <div
          style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}
        >
          {ip.device_id && (
            <a
              href={`/devices/${ip.device_id}`}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-morning-blue)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              View Device
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-brew-black-20)',
              color: 'var(--color-brew-black)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--color-brew-black-60)', fontWeight: '500' }}>
        {label}:
      </span>
      <span style={{ fontSize: '0.9rem', color: 'var(--color-brew-black)', fontWeight: '500' }}>
        {value}
      </span>
    </div>
  )
}
