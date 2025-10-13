/**
 * Top Utilized Subnets Widget
 *
 * Dashboard widget showing the 10 most utilized subnets
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Network } from '@/types'

interface NetworkWithUtilization extends Network {
  utilization_percent: number
  allocated_count: number
  total_hosts: number
}

export default function TopUtilizedSubnetsWidget() {
  const [networks, setNetworks] = useState<NetworkWithUtilization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopUtilized()
  }, [])

  const fetchTopUtilized = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/networks/top-utilized?limit=10')
      if (!response.ok) {
        throw new Error('Failed to fetch top utilized subnets')
      }

      const result = await response.json()
      setNetworks(result.data || [])
    } catch (err) {
      console.error('Error fetching top utilized subnets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getUtilizationColor = (percent: number): string => {
    if (percent >= 90) return 'var(--color-orange)' // Critical
    if (percent >= 80) return 'var(--color-tangerine)' // Warning
    if (percent >= 50) return 'var(--color-morning-blue)' // Moderate
    return 'var(--color-green)' // Healthy
  }

  const getUtilizationLabel = (percent: number): string => {
    if (percent >= 90) return 'Critical'
    if (percent >= 80) return 'Warning'
    if (percent >= 50) return 'Moderate'
    return 'Healthy'
  }

  if (loading) {
    return (
      <div className="widget-container">
        <h3 className="widget-title">Top 10 Utilized Subnets</h3>
        <div className="widget-loading">Loading...</div>
        <style jsx>{getStyles()}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="widget-container">
        <h3 className="widget-title">Top 10 Utilized Subnets</h3>
        <div className="widget-error">Error: {error}</div>
        <style jsx>{getStyles()}</style>
      </div>
    )
  }

  if (networks.length === 0) {
    return (
      <div className="widget-container">
        <h3 className="widget-title">Top 10 Utilized Subnets</h3>
        <div className="widget-empty">
          No networks with allocated IPs found.
          <Link href="/networks/new" className="empty-link">
            Create your first network
          </Link>
        </div>
        <style jsx>{getStyles()}</style>
      </div>
    )
  }

  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3 className="widget-title">Top 10 Utilized Subnets</h3>
        <Link href="/networks/hierarchy" className="view-all-link">
          View Hierarchy →
        </Link>
      </div>

      <div className="networks-list">
        {networks.map((network, index) => (
          <Link
            key={network.id}
            href={`/networks/${network.id}`}
            className="network-item"
            style={{
              borderLeftColor: getUtilizationColor(network.utilization_percent),
            }}
          >
            <div className="network-rank">#{index + 1}</div>
            <div className="network-details">
              <div className="network-name-row">
                <span className="network-name">{network.network_name}</span>
                <span className="network-cidr">{network.network_address}</span>
              </div>
              <div className="utilization-row">
                <div className="utilization-bar-container">
                  <div
                    className="utilization-bar-fill"
                    style={{
                      width: `${Math.min(network.utilization_percent, 100)}%`,
                      backgroundColor: getUtilizationColor(network.utilization_percent),
                    }}
                  />
                </div>
                <span className="utilization-percent">{network.utilization_percent}%</span>
              </div>
              <div className="network-meta">
                <span className="host-count">
                  {network.allocated_count} / {network.total_hosts} hosts
                </span>
                <span
                  className="utilization-label"
                  style={{ color: getUtilizationColor(network.utilization_percent) }}
                >
                  {getUtilizationLabel(network.utilization_percent)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{getStyles()}</style>
    </div>
  )
}

function getStyles() {
  return `
    .widget-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid var(--color-brew-black-10);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .widget-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-brew-black);
    }

    .view-all-link {
      font-size: 0.9rem;
      color: var(--color-morning-blue);
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    .view-all-link:hover {
      opacity: 0.8;
    }

    .widget-loading,
    .widget-error,
    .widget-empty {
      padding: 2rem;
      text-align: center;
      color: var(--color-brew-black-60);
    }

    .widget-error {
      color: var(--color-orange);
    }

    .empty-link {
      display: block;
      margin-top: 1rem;
      color: var(--color-morning-blue);
      text-decoration: none;
    }

    .empty-link:hover {
      text-decoration: underline;
    }

    .networks-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow-y: auto;
      max-height: 600px;
    }

    .network-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-off-white);
      border-radius: 6px;
      border-left: 4px solid;
      text-decoration: none;
      transition: all 0.2s;
    }

    .network-item:hover {
      background: var(--color-brew-black-5);
      transform: translateX(2px);
    }

    .network-rank {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-brew-black-40);
      flex-shrink: 0;
      width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .network-details {
      flex: 1;
      min-width: 0;
    }

    .network-name-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .network-name {
      font-weight: 600;
      color: var(--color-brew-black);
      flex-shrink: 0;
    }

    .network-cidr {
      font-family: monospace;
      font-size: 0.85em;
      color: var(--color-brew-black-60);
      background: var(--color-brew-black-10);
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
    }

    .utilization-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .utilization-bar-container {
      flex: 1;
      height: 8px;
      background: var(--color-brew-black-10);
      border-radius: 4px;
      overflow: hidden;
    }

    .utilization-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .utilization-percent {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--color-brew-black);
      flex-shrink: 0;
      min-width: 45px;
      text-align: right;
    }

    .network-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }

    .host-count {
      color: var(--color-brew-black-60);
    }

    .utilization-label {
      font-weight: 500;
    }
  `
}
