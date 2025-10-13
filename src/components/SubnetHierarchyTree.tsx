/**
 * SubnetHierarchyTree Component
 *
 * Interactive tree view for network hierarchy with utilization display
 * Supports expand/collapse and drag-and-drop reorganization
 */
'use client'

import React, { useState, useEffect } from 'react'
import { Network } from '@/types'
import { toast } from 'sonner'

interface NetworkWithUtilization extends Network {
  utilization_percent: number
  allocated_count: number
  total_hosts: number
  children?: NetworkWithUtilization[]
}

interface TreeNodeProps {
  network: NetworkWithUtilization
  level: number
  onToggle: (id: string) => void
  expanded: Set<string>
  onDragStart: (e: React.DragEvent, network: NetworkWithUtilization) => void
  onDrop: (e: React.DragEvent, targetNetwork: NetworkWithUtilization) => void
  onDragOver: (e: React.DragEvent) => void
  onNetworkClick: (id: string) => void
}

function TreeNode({
  network,
  level,
  onToggle,
  expanded,
  onDragStart,
  onDrop,
  onDragOver,
  onNetworkClick,
}: TreeNodeProps) {
  const hasChildren = network.children && network.children.length > 0
  const isExpanded = expanded.has(network.id)

  // Determine utilization color
  const getUtilizationColor = (percent: number): string => {
    if (percent >= 90) return '#FD6A3D' // Orange - critical
    if (percent >= 80) return '#FFBB5C' // Tangerine - warning
    if (percent >= 50) return '#1C7FF2' // Morning Blue - moderate
    return '#28C077' // Green - healthy
  }

  const utilizationColor = getUtilizationColor(network.utilization_percent)

  return (
    <>
      <div
        className="tree-node"
        style={{ paddingLeft: `${level * 24}px` }}
        draggable
        onDragStart={(e) => onDragStart(e, network)}
        onDrop={(e) => onDrop(e, network)}
        onDragOver={onDragOver}
      >
        {/* Expand/collapse toggle */}
        <button
          className="toggle-button"
          onClick={() => hasChildren && onToggle(network.id)}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : '○'}
        </button>

        {/* Network info */}
        <div className="network-info" onClick={() => onNetworkClick(network.id)}>
          <div className="network-name-row">
            <span className="network-name">{network.network_name}</span>
            {network.network_address && (
              <span className="network-cidr">{network.network_address}</span>
            )}
          </div>
          {network.network_address && (
            <div className="utilization-bar">
              <div
                className="utilization-fill"
                style={{
                  width: `${Math.min(network.utilization_percent, 100)}%`,
                  backgroundColor: utilizationColor,
                }}
              />
              <span className="utilization-text">
                {network.utilization_percent}% ({network.allocated_count}/{network.total_hosts}{' '}
                hosts)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Render children */}
      {isExpanded &&
        hasChildren &&
        network.children!.map((child) => (
          <TreeNode
            key={child.id}
            network={child}
            level={level + 1}
            onToggle={onToggle}
            expanded={expanded}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNetworkClick={onNetworkClick}
          />
        ))}
    </>
  )
}

interface SubnetHierarchyTreeProps {
  locationId?: string
  onNetworkClick?: (networkId: string) => void
}

export function SubnetHierarchyTree({ locationId, onNetworkClick }: SubnetHierarchyTreeProps) {
  const [networks, setNetworks] = useState<NetworkWithUtilization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [draggedNetwork, setDraggedNetwork] = useState<NetworkWithUtilization | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch network hierarchy
  useEffect(() => {
    fetchHierarchy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId])

  const fetchHierarchy = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (locationId) {
        params.append('location_id', locationId)
      }

      const response = await fetch(`/api/networks/hierarchy?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch network hierarchy')
      }

      const result = await response.json()
      setNetworks(result.data.root_networks || [])

      // Auto-expand root networks
      const rootIds = new Set(result.data.root_networks.map((n: Network) => n.id))
      setExpanded(rootIds)
    } catch (err) {
      console.error('Error fetching hierarchy:', err)
      setError(err instanceof Error ? err.message : 'Failed to load hierarchy')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDragStart = (e: React.DragEvent, network: NetworkWithUtilization) => {
    setDraggedNetwork(network)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetNetwork: NetworkWithUtilization) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedNetwork || draggedNetwork.id === targetNetwork.id) {
      return
    }

    // Prevent dropping a network onto its own descendant
    if (isDescendant(targetNetwork, draggedNetwork.id)) {
      toast.error('Cannot move a network into its own child')
      return
    }

    try {
      // Update parent_network_id
      const response = await fetch(`/api/networks/${draggedNetwork.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_network_id: targetNetwork.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to update network hierarchy')
      }

      toast.success(`Moved ${draggedNetwork.network_name} under ${targetNetwork.network_name}`)
      fetchHierarchy()
    } catch (err) {
      console.error('Error updating hierarchy:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update hierarchy')
    } finally {
      setDraggedNetwork(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Check if target is a descendant of source
  const isDescendant = (network: NetworkWithUtilization, ancestorId: string): boolean => {
    if (network.id === ancestorId) return true
    if (!network.children) return false
    return network.children.some((child) => isDescendant(child, ancestorId))
  }

  const handleExpandAll = () => {
    const allIds = new Set<string>()
    const collectIds = (nets: NetworkWithUtilization[]) => {
      nets.forEach((n) => {
        allIds.add(n.id)
        if (n.children) collectIds(n.children)
      })
    }
    collectIds(networks)
    setExpanded(allIds)
  }

  const handleCollapseAll = () => {
    setExpanded(new Set())
  }

  const handleNetworkClick = (networkId: string) => {
    if (onNetworkClick) {
      onNetworkClick(networkId)
    } else {
      window.location.href = `/networks/${networkId}`
    }
  }

  // Filter networks by search term
  const filteredNetworks = searchTerm
    ? networks.filter((n) => n.network_name.toLowerCase().includes(searchTerm.toLowerCase()))
    : networks

  if (loading) {
    return <div className="loading">Loading network hierarchy...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  if (networks.length === 0) {
    return <div className="empty">No networks found. Create your first network to get started.</div>
  }

  return (
    <div className="subnet-hierarchy-tree">
      {/* Controls */}
      <div className="tree-controls">
        <input
          type="text"
          placeholder="Search networks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="tree-actions">
          <button onClick={handleExpandAll} className="tree-button">
            Expand All
          </button>
          <button onClick={handleCollapseAll} className="tree-button">
            Collapse All
          </button>
          <button onClick={fetchHierarchy} className="tree-button">
            Refresh
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="tree-container">
        {filteredNetworks.map((network) => (
          <TreeNode
            key={network.id}
            network={network}
            level={0}
            onToggle={handleToggle}
            expanded={expanded}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onNetworkClick={handleNetworkClick}
          />
        ))}
      </div>

      <style jsx>{`
        .subnet-hierarchy-tree {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .tree-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .search-input {
          flex: 1;
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-brew-black-20);
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-morning-blue);
          box-shadow: 0 0 0 3px rgba(28, 127, 242, 0.1);
        }

        .tree-actions {
          display: flex;
          gap: 0.5rem;
        }

        .tree-button {
          padding: 0.5rem 1rem;
          background: var(--color-brew-black-10);
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .tree-button:hover {
          background: var(--color-brew-black-20);
        }

        .tree-container {
          border: 1px solid var(--color-brew-black-10);
          border-radius: 6px;
          background: var(--color-off-white);
        }

        .tree-node {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid var(--color-brew-black-5);
          cursor: move;
          transition: background 0.2s;
        }

        .tree-node:hover {
          background: rgba(28, 127, 242, 0.05);
        }

        .tree-node:last-child {
          border-bottom: none;
        }

        .toggle-button {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          color: var(--color-brew-black-60);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toggle-button:disabled {
          cursor: default;
          opacity: 0.3;
        }

        .network-info {
          flex: 1;
          cursor: pointer;
        }

        .network-info:hover .network-name {
          color: var(--color-morning-blue);
        }

        .network-name-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .network-name {
          font-weight: 500;
          color: var(--color-brew-black);
          transition: color 0.2s;
        }

        .network-cidr {
          font-family: monospace;
          font-size: 0.85em;
          color: var(--color-brew-black-60);
          background: var(--color-brew-black-5);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .utilization-bar {
          position: relative;
          height: 20px;
          background: var(--color-brew-black-10);
          border-radius: 4px;
          overflow: hidden;
        }

        .utilization-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          transition: width 0.3s ease;
        }

        .utilization-text {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-brew-black);
          text-shadow: 0 0 2px white;
        }

        .loading,
        .error,
        .empty {
          padding: 2rem;
          text-align: center;
          color: var(--color-brew-black-60);
        }

        .error {
          color: var(--color-orange);
        }
      `}</style>
    </div>
  )
}
