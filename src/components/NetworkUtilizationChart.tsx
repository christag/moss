/**
 * Network Utilization Chart
 *
 * Donut chart showing network IP address utilization breakdown
 */
'use client'

import React, { useState, useEffect } from 'react'

interface UtilizationData {
  allocated: number
  dhcp_pool: number
  reserved: number
  available: number
  total_hosts: number
}

interface NetworkUtilizationChartProps {
  networkId: string
}

export function NetworkUtilizationChart({ networkId }: NetworkUtilizationChartProps) {
  const [data, setData] = useState<UtilizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUtilization()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId])

  const fetchUtilization = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/networks/${networkId}/utilization-summary`)
      if (!response.ok) {
        throw new Error('Failed to fetch utilization data')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error fetching utilization:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="chart-loading">Loading utilization chart...</div>
  }

  if (error) {
    return <div className="chart-error">Error: {error}</div>
  }

  if (!data) {
    return <div className="chart-empty">No utilization data available</div>
  }

  // Calculate percentages
  const total = data.total_hosts
  const allocatedPercent = total > 0 ? (data.allocated / total) * 100 : 0
  const dhcpPercent = total > 0 ? (data.dhcp_pool / total) * 100 : 0
  const reservedPercent = total > 0 ? (data.reserved / total) * 100 : 0
  const availablePercent = total > 0 ? (data.available / total) * 100 : 0

  // Calculate stroke-dasharray for donut segments
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeWidth = 20

  // Starting offset for each segment
  let currentOffset = 0

  const segments = [
    {
      label: 'Allocated',
      value: data.allocated,
      percent: allocatedPercent,
      color: '#28C077', // Green
      offset: currentOffset,
    },
    {
      label: 'DHCP Pool',
      value: data.dhcp_pool,
      percent: dhcpPercent,
      color: '#FFBB5C', // Tangerine
      offset: (currentOffset += (allocatedPercent / 100) * circumference),
    },
    {
      label: 'Reserved',
      value: data.reserved,
      percent: reservedPercent,
      color: '#1C7FF2', // Morning Blue
      offset: (currentOffset += (dhcpPercent / 100) * circumference),
    },
    {
      label: 'Available',
      value: data.available,
      percent: availablePercent,
      color: '#E5E5E5', // Light Gray
      offset: (currentOffset += (reservedPercent / 100) * circumference),
    },
  ]

  return (
    <div className="utilization-chart">
      <h3 className="chart-title">IP Address Utilization</h3>

      <div className="chart-container">
        {/* SVG Donut Chart */}
        <svg width="200" height="200" viewBox="0 0 200 200" className="donut-chart">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
          />
          {segments.map(
            (segment) =>
              segment.percent > 0 && (
                <circle
                  key={segment.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${(segment.percent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-segment.offset}
                  transform="rotate(-90 100 100)"
                  className="donut-segment"
                />
              )
          )}
          {/* Center text */}
          <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="600" fill="#231F20">
            {Math.round((data.allocated / total) * 100)}%
          </text>
          <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#666">
            Used
          </text>
        </svg>

        {/* Legend */}
        <div className="chart-legend">
          {segments.map((segment) => (
            <div key={segment.label} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: segment.color }} />
              <div className="legend-details">
                <div className="legend-label">{segment.label}</div>
                <div className="legend-value">
                  {segment.value} ({Math.round(segment.percent)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Total Hosts:</span>
          <span className="summary-value">{total}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Usable Hosts:</span>
          <span className="summary-value">{total - 2}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Utilization:</span>
          <span className="summary-value">
            {Math.round(((data.allocated + data.reserved) / (total - 2)) * 100)}%
          </span>
        </div>
      </div>

      <style jsx>{`
        .utilization-chart {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid var(--color-brew-black-10);
        }

        .chart-title {
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .chart-container {
          display: flex;
          gap: 2rem;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .donut-chart {
          flex-shrink: 0;
        }

        .donut-segment {
          transition: stroke-width 0.3s;
        }

        .donut-segment:hover {
          stroke-width: 24;
        }

        .chart-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-details {
          flex: 1;
        }

        .legend-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-brew-black);
        }

        .legend-value {
          font-size: 0.85rem;
          color: var(--color-brew-black-60);
        }

        .chart-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-brew-black-10);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .summary-label {
          font-size: 0.85rem;
          color: var(--color-brew-black-60);
        }

        .summary-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .chart-loading,
        .chart-error,
        .chart-empty {
          padding: 2rem;
          text-align: center;
          color: var(--color-brew-black-60);
        }

        .chart-error {
          color: var(--color-orange);
        }

        @media (max-width: 768px) {
          .chart-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
