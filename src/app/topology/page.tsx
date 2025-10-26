'use client'

/**
 * Network Topology Page
 * Interactive network topology visualization with filters and legend
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamicImport from 'next/dynamic'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

// Dynamically import NetworkTopologyViewer to avoid SSR issues with Cytoscape
const NetworkTopologyViewer = dynamicImport(
  () => import('@/components/NetworkTopologyViewer').then((mod) => mod.NetworkTopologyViewer),
  {
    ssr: false,
    loading: () => <div>Loading topology viewer...</div>,
  }
)

interface Location {
  id: string
  location_name: string
}

export default function TopologyPage() {
  const [filters, setFilters] = useState({
    location_id: '',
  })
  const [locations, setLocations] = useState<Location[]>([])
  const [apiEndpoint, setApiEndpoint] = useState('/api/topology/network')

  // Fetch locations for filter dropdown
  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch('/api/locations')
        const result = await response.json()
        if (result.success) {
          setLocations(result.data.locations || [])
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      }
    }
    fetchLocations()
  }, [])

  // Build API endpoint with filters
  const buildApiEndpoint = () => {
    const params = new URLSearchParams()
    if (filters.location_id) {
      params.set('location_id', filters.location_id)
    }
    const queryString = params.toString()
    return `/api/topology/network${queryString ? `?${queryString}` : ''}`
  }

  const applyFilters = () => {
    setApiEndpoint(buildApiEndpoint())
  }

  return (
    <div className="topology-page">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link href="/">Home</Link> / <span>Network Topology</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1>Network Topology</h1>
        <p className="subtitle">
          Interactive visualization of network connectivity and device relationships
        </p>
      </div>

      <div className="topology-layout">
        {/* Left Sidebar - Filters */}
        <aside className="filter-panel">
          <h3>Filters</h3>

          <div className="filter-group">
            <label htmlFor="location-filter">
              Location:
              <select
                id="location-filter"
                value={filters.location_id}
                onChange={(e) => setFilters({ ...filters, location_id: e.target.value })}
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.location_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button onClick={applyFilters} className="apply-filters-button">
            Apply Filters
          </button>

          <div className="filter-help">
            <h4>Controls</h4>
            <ul>
              <li>
                <strong>Click</strong> node: Show details
              </li>
              <li>
                <strong>Double-click</strong> node: Go to device
              </li>
              <li>
                <strong>Drag</strong> node: Reposition
              </li>
              <li>
                <strong>+/-</strong>: Zoom in/out
              </li>
              <li>
                <strong>F</strong>: Fit to screen
              </li>
              <li>
                <strong>L</strong>: Toggle layer mode
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content - Topology */}
        <main className="topology-main">
          <NetworkTopologyViewer apiEndpoint={apiEndpoint} />
        </main>

        {/* Right Sidebar - Legend */}
        <aside className="legend-panel">
          <h3>Legend</h3>

          <div className="legend-section">
            <h4>Device Types</h4>
            <div className="legend-item">
              <div className="node-icon router"></div>
              <span>Router</span>
            </div>
            <div className="legend-item">
              <div className="node-icon switch"></div>
              <span>Switch</span>
            </div>
            <div className="legend-item">
              <div className="node-icon server"></div>
              <span>Server</span>
            </div>
            <div className="legend-item">
              <div className="node-icon firewall"></div>
              <span>Firewall</span>
            </div>
          </div>

          <div className="legend-section">
            <h4>Status</h4>
            <div className="legend-item">
              <div className="status-icon active"></div>
              <span>Active</span>
            </div>
            <div className="legend-item">
              <div className="status-icon inactive"></div>
              <span>Inactive</span>
            </div>
          </div>

          <div className="legend-section">
            <h4>Connections</h4>
            <div className="legend-item">
              <div className="edge-line"></div>
              <span>Physical Link</span>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .topology-page {
          padding: 1rem;
          max-width: 100%;
        }

        .breadcrumbs {
          font-size: 0.875rem;
          color: var(--color-brew-black-60, #666);
          margin-bottom: 1rem;
        }

        .breadcrumbs a {
          color: var(--color-morning-blue, #1c7ff2);
          text-decoration: none;
        }

        .breadcrumbs a:hover {
          text-decoration: underline;
        }

        .page-header {
          margin-bottom: 1.5rem;
        }

        .page-header h1 {
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-brew-black, #231f20);
        }

        .subtitle {
          font-size: 1rem;
          color: var(--color-brew-black-60, #666);
          margin: 0;
        }

        .topology-layout {
          display: grid;
          grid-template-columns: 250px 1fr 200px;
          gap: 1rem;
        }

        .filter-panel,
        .legend-panel {
          background: var(--color-background, #fff);
          padding: 1rem;
          border: 1px solid var(--color-border, #6b7885);
          border-radius: 8px;
          height: fit-content;
        }

        .filter-panel h3,
        .legend-panel h3 {
          font-size: 1rem;
          margin: 0 0 1rem 0;
          color: var(--color-brew-black, #231f20);
        }

        .filter-group {
          margin-bottom: 1rem;
        }

        .filter-group label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-brew-black, #231f20);
        }

        .filter-group select {
          height: 44px;
          padding: 0 1rem;
          border: 1px solid var(--color-border, #6b7885);
          border-radius: 4px;
          background: var(--color-background, #fff);
          font-family: Inter;
          font-size: 1rem;
        }

        .apply-filters-button {
          width: 100%;
          height: 44px;
          background: var(--color-brew-black, #231f20);
          color: var(--color-off-white, #faf9f5);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-family: Inter;
          font-size: 1rem;
          font-weight: 500;
        }

        .apply-filters-button:hover {
          background: var(--color-brew-black-80, #3a3738);
        }

        .filter-help {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border, #6b7885);
        }

        .filter-help h4 {
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-brew-black, #231f20);
        }

        .filter-help ul {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.75rem;
          color: var(--color-brew-black-60, #666);
          line-height: 1.6;
        }

        .legend-section {
          margin-bottom: 1.5rem;
        }

        .legend-section:last-child {
          margin-bottom: 0;
        }

        .legend-section h4 {
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-brew-black, #231f20);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-brew-black, #231f20);
        }

        .node-icon {
          width: 24px;
          height: 24px;
          border: 2px solid var(--color-border, #6b7885);
        }

        .node-icon.router {
          background: var(--color-morning-blue, #1c7ff2);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        .node-icon.switch {
          background: var(--color-morning-blue, #1c7ff2);
          border-radius: 2px;
        }

        .node-icon.server {
          background: var(--color-green, #28c077);
          border-radius: 50%;
        }

        .node-icon.firewall {
          background: var(--color-orange, #fd6a3d);
          transform: rotate(45deg);
        }

        .status-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .status-icon.active {
          background: var(--color-green, #28c077);
        }

        .status-icon.inactive {
          background: var(--color-brew-black-40, #999);
        }

        .edge-line {
          width: 30px;
          height: 2px;
          background: var(--color-border, #6b7885);
        }

        .topology-main {
          min-height: 600px;
        }

        @media (max-width: 1024px) {
          .topology-layout {
            grid-template-columns: 1fr;
          }

          .filter-panel,
          .legend-panel {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
