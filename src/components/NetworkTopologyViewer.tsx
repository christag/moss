'use client'

/**
 * NetworkTopologyViewer Component
 * Interactive network topology visualization using Cytoscape.js
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import cytoscape from 'cytoscape'
// @ts-ignore - cytoscape-cola types not available
import cola from 'cytoscape-cola'
// @ts-ignore - cytoscape-svg types not available
import cytoscapeSvg from 'cytoscape-svg'
import type { TopologyGraph } from '@/lib/schemas/topology'

// Register Cytoscape extensions
if (typeof window !== 'undefined') {
  cytoscape.use(cola)
  cytoscape.use(cytoscapeSvg)
}

interface NetworkTopologyViewerProps {
  apiEndpoint: string
  className?: string
  height?: string
}

type LayoutType = 'cola' | 'circular' | 'grid' | 'breadthfirst'
type ViewMode = 'layer2' | 'layer3'

interface Tooltip {
  visible: boolean
  x?: number
  y?: number
  content?: string
}

export function NetworkTopologyViewer({
  apiEndpoint,
  className = '',
  height = 'calc(100vh - 200px)',
}: NetworkTopologyViewerProps) {
  const [topologyData, setTopologyData] = useState<TopologyGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('cola')
  const [viewMode, setViewMode] = useState<ViewMode>('layer2')
  const [tooltip, setTooltip] = useState<Tooltip>({ visible: false })
  const [cyInstance, setCyInstance] = useState<cytoscape.Core | null>(null)
  const [manualPositions, setManualPositions] = useState<Record<string, { x: number; y: number }>>(
    {}
  )
  const [selectedVLANs, setSelectedVLANs] = useState<string[]>([])
  const [highlightedVLAN, setHighlightedVLAN] = useState<string | null>(null)
  const [allVLANs, setAllVLANs] = useState<Array<{ id: string; name: string }>>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch topology data
  const fetchTopology = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(apiEndpoint)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to load topology')
      }

      setTopologyData(result.data)

      // Extract unique VLANs from edges
      const vlans = new Map<string, string>()
      result.data.edges.forEach((edge: { native_network_id?: string; network_name?: string }) => {
        if (edge.native_network_id && edge.network_name) {
          vlans.set(edge.native_network_id, edge.network_name)
        }
      })
      setAllVLANs(Array.from(vlans.entries()).map(([id, name]) => ({ id, name })))
      setSelectedVLANs(Array.from(vlans.keys()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint])

  useEffect(() => {
    fetchTopology()
  }, [fetchTopology])

  // Load manual positions from localStorage
  useEffect(() => {
    const storageKey = `topology-positions-${apiEndpoint}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setManualPositions(JSON.parse(saved))
      } catch {
        // Ignore parse errors
      }
    }
  }, [apiEndpoint])

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!topologyData || !containerRef.current || typeof window === 'undefined') {
      return
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: {
        nodes: topologyData.nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.label,
            device_type: node.device_type,
            connection_count: node.connection_count,
            status: node.status,
            location_name: node.location_name,
            io_count: node.io_count,
          },
        })),
        edges: topologyData.edges.map((edge) => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            interface_type: edge.interface_type,
            speed: edge.speed,
            trunk_mode: edge.trunk_mode,
            native_network_id: edge.native_network_id,
            network_name: edge.network_name,
          },
        })),
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1C7FF2', // Morning Blue
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'font-family': 'Inter',
            color: '#231F20', // Brew Black
            width: 'mapData(connection_count, 0, 20, 40, 100)',
            height: 'mapData(connection_count, 0, 20, 40, 100)',
            'border-width': 2,
            'border-color': '#6B7885', // border-default
          },
        },
        {
          selector: 'node[device_type="router"]',
          style: {
            shape: 'triangle',
            'background-color': '#1C7FF2',
          },
        },
        {
          selector: 'node[device_type="switch"]',
          style: {
            shape: 'rectangle',
            'background-color': '#1C7FF2',
          },
        },
        {
          selector: 'node[device_type="server"]',
          style: {
            shape: 'ellipse',
            'background-color': '#28C077', // Green
          },
        },
        {
          selector: 'node[device_type="firewall"]',
          style: {
            shape: 'diamond',
            'background-color': '#FD6A3D', // Orange
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#FD6A3D', // Orange
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#6B7885', // border-default
            'target-arrow-color': '#6B7885',
            'curve-style': 'bezier',
            label: 'data(network_name)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#1C7FF2', // Morning Blue
            width: 4,
          },
        },
      ],
      layout: {
        name: selectedLayout,
        ...(selectedLayout === 'cola'
          ? {
              nodeSpacing: 80,
              edgeLength: 120,
              animate: true,
              randomize: false,
            }
          : {}),
      },
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.2,
    })

    setCyInstance(cy)

    // Apply manual positions if they exist
    if (Object.keys(manualPositions).length > 0) {
      Object.entries(manualPositions).forEach(([nodeId, pos]) => {
        const node = cy.getElementById(nodeId)
        if (node.length > 0) {
          node.position(pos)
        }
      })
    }

    // Event handlers
    cy.on('tap', 'node', (event) => {
      const node = event.target
      const nodeData = node.data()
      const renderedPos = node.renderedPosition()
      setTooltip({
        visible: true,
        x: renderedPos.x,
        y: renderedPos.y,
        content: `${nodeData.label} (${nodeData.device_type})\nLocation: ${nodeData.location_name || 'N/A'}\nIOs: ${nodeData.io_count}\nConnections: ${nodeData.connection_count}`,
      })
    })

    cy.on('dbltap', 'node', (event) => {
      const node = event.target
      const deviceId = node.data('id')
      router.push(`/devices/${deviceId}`)
    })

    cy.on('tap', 'edge', (event) => {
      const edge = event.target
      const edgeData = edge.data()
      const renderedPos = edge.renderedMidpoint()
      setTooltip({
        visible: true,
        x: renderedPos.x,
        y: renderedPos.y,
        content: `${edgeData.label}\n${edgeData.interface_type}\nSpeed: ${edgeData.speed || 'N/A'}\nVLAN: ${edgeData.network_name || 'N/A'}`,
      })
    })

    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.elements().unselect()
        setTooltip({ visible: false })
      }
    })

    // Save position on drag
    cy.on('dragfree', 'node', (event) => {
      const node = event.target
      const position = node.position()
      const nodeId = node.data('id')

      const newPositions = {
        ...manualPositions,
        [nodeId]: position,
      }
      setManualPositions(newPositions)

      const storageKey = `topology-positions-${apiEndpoint}`
      localStorage.setItem(storageKey, JSON.stringify(newPositions))
    })

    return () => {
      cy.destroy()
    }
  }, [topologyData, selectedLayout, router, apiEndpoint, manualPositions])

  // Apply VLAN filtering
  useEffect(() => {
    if (!cyInstance || selectedVLANs.length === 0 || selectedVLANs.length === allVLANs.length) {
      return
    }

    cyInstance.elements().forEach((element) => {
      const networkId = element.data('native_network_id')
      if (selectedVLANs.includes(networkId) || !networkId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(element as any).show()
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(element as any).hide()
      }
    })
  }, [selectedVLANs, cyInstance, allVLANs])

  // Apply VLAN highlighting
  useEffect(() => {
    if (!cyInstance) return

    if (highlightedVLAN) {
      cyInstance.elements().forEach((element) => {
        const networkId = element.data('native_network_id')
        if (networkId === highlightedVLAN) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(element as any).style('opacity', 1)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(element as any).style('opacity', 0.3)
        }
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(cyInstance.elements() as any).style('opacity', 1)
    }
  }, [highlightedVLAN, cyInstance])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!cyInstance) return

      if (e.key === '+' || e.key === '=') {
        cyInstance.zoom(cyInstance.zoom() * 1.2)
        cyInstance.center()
      } else if (e.key === '-' || e.key === '_') {
        cyInstance.zoom(cyInstance.zoom() * 0.8)
        cyInstance.center()
      } else if (e.key === 'f' || e.key === 'F') {
        cyInstance.fit()
      } else if (e.key === 'Escape') {
        cyInstance.elements().unselect()
        setTooltip({ visible: false })
      } else if (e.key === 'l' || e.key === 'L') {
        setViewMode((mode) => (mode === 'layer2' ? 'layer3' : 'layer2'))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cyInstance])

  // Control handlers
  const handleZoomIn = () => {
    if (cyInstance) {
      cyInstance.zoom(cyInstance.zoom() * 1.2)
      cyInstance.center()
    }
  }

  const handleZoomOut = () => {
    if (cyInstance) {
      cyInstance.zoom(cyInstance.zoom() * 0.8)
      cyInstance.center()
    }
  }

  const handleFitScreen = () => {
    if (cyInstance) {
      cyInstance.fit()
    }
  }

  const handleResetLayout = () => {
    setManualPositions({})
    const storageKey = `topology-positions-${apiEndpoint}`
    localStorage.removeItem(storageKey)
    if (cyInstance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cyInstance.layout({ name: selectedLayout } as any).run()
    }
  }

  const exportAsSVG = () => {
    if (!cyInstance) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svgContent = (cyInstance as any).svg({ scale: 1, full: true })
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `network-topology-${Date.now()}.svg`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('SVG export failed:', err)
    }
  }

  const exportAsPNG = (scale = 2) => {
    if (!cyInstance) return
    try {
      const pngData = cyInstance.png({ scale, full: true, bg: '#FAF9F5' })
      const link = document.createElement('a')
      link.href = pngData
      link.download = `network-topology-${Date.now()}.png`
      link.click()
    } catch (err) {
      console.error('PNG export failed:', err)
    }
  }

  const handleExport = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value
    if (format === 'svg') {
      exportAsSVG()
    } else if (format === 'png') {
      exportAsPNG()
    }
    e.target.value = '' // Reset dropdown
  }

  const handleVLANToggle = (vlanId: string, checked: boolean) => {
    if (checked) {
      setSelectedVLANs([...selectedVLANs, vlanId])
    } else {
      setSelectedVLANs(selectedVLANs.filter((id) => id !== vlanId))
    }
  }

  const handleVLANHighlight = (vlanId: string) => {
    setHighlightedVLAN(highlightedVLAN === vlanId ? null : vlanId)
  }

  if (loading) {
    return (
      <div className={`network-topology-viewer ${className}`}>
        <div className="loading-state">Loading topology...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`network-topology-viewer ${className}`}>
        <div className="error-state">
          <p style={{ color: 'var(--color-orange)' }}>{error}</p>
          <button onClick={fetchTopology} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!topologyData || topologyData.nodes.length === 0) {
    return (
      <div className={`network-topology-viewer ${className}`}>
        <div className="empty-state">
          No network connections found. Add device connections in the IOs section.
        </div>
      </div>
    )
  }

  return (
    <div className={`network-topology-viewer ${className}`}>
      {/* Toolbar */}
      <div className="toolbar">
        <select
          value={selectedLayout}
          onChange={(e) => setSelectedLayout(e.target.value as LayoutType)}
          aria-label="Select layout algorithm"
          title="Layout Algorithm"
        >
          <option value="cola">Cola (Force-Directed)</option>
          <option value="circular">Circular</option>
          <option value="grid">Grid</option>
          <option value="breadthfirst">Hierarchical</option>
        </select>

        <button onClick={handleZoomIn} aria-label="Zoom in" title="Zoom in (+)">
          +
        </button>
        <button onClick={handleZoomOut} aria-label="Zoom out" title="Zoom out (-)">
          -
        </button>
        <button onClick={handleFitScreen} aria-label="Fit to screen" title="Fit to screen (F)">
          Fit
        </button>
        <button
          onClick={handleResetLayout}
          aria-label="Reset layout"
          title="Reset manual positions"
        >
          Reset Layout
        </button>

        <button
          onClick={() => setViewMode(viewMode === 'layer2' ? 'layer3' : 'layer2')}
          aria-label={`Switch to ${viewMode === 'layer2' ? 'Layer 3' : 'Layer 2'} view`}
          title={`Layer mode (L)`}
        >
          {viewMode === 'layer2' ? 'Layer 2' : 'Layer 3'}
        </button>

        <select onChange={handleExport} aria-label="Export topology">
          <option value="">Export...</option>
          <option value="svg">SVG</option>
          <option value="png">PNG</option>
        </select>
      </div>

      {/* Main content */}
      <div className="topology-content">
        {/* VLAN filter panel */}
        {allVLANs.length > 0 && (
          <div className="vlan-filter-panel">
            <h3>VLANs</h3>
            <div className="vlan-controls">
              <button onClick={() => setSelectedVLANs(allVLANs.map((v) => v.id))}>
                Select All
              </button>
              <button onClick={() => setSelectedVLANs([])}>Deselect All</button>
            </div>
            <div className="vlan-list">
              {allVLANs.map((vlan) => (
                <label key={vlan.id}>
                  <input
                    type="checkbox"
                    checked={selectedVLANs.includes(vlan.id)}
                    onChange={(e) => handleVLANToggle(vlan.id, e.target.checked)}
                  />
                  <span
                    className="vlan-chip"
                    onClick={() => handleVLANHighlight(vlan.id)}
                    style={{
                      backgroundColor: highlightedVLAN === vlan.id ? '#1C7FF2' : '#E0E0E0',
                      color: highlightedVLAN === vlan.id ? '#FFF' : '#231F20',
                    }}
                  >
                    {vlan.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div ref={containerRef} className="topology-canvas" style={{ height }} />

        {/* Tooltip */}
        {tooltip.visible && tooltip.content && (
          <div
            className="tooltip"
            style={{
              left: tooltip.x,
              top: tooltip.y,
            }}
          >
            {tooltip.content.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .network-topology-viewer {
          background: var(--color-background, #fff);
          border: 1px solid var(--color-border, #6b7885);
          border-radius: 8px;
          overflow: hidden;
        }

        .topology-content {
          display: flex;
          position: relative;
        }

        .topology-canvas {
          flex: 1;
          width: 100%;
          background: var(--color-off-white, #faf9f5);
        }

        .vlan-filter-panel {
          width: 220px;
          background: var(--color-background, #fff);
          border-right: 1px solid var(--color-border, #6b7885);
          padding: 1rem;
          overflow-y: auto;
          max-height: calc(100vh - 250px);
        }

        .vlan-filter-panel h3 {
          font-size: 1rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-text, #231f20);
        }

        .vlan-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .vlan-controls button {
          flex: 1;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border: 1px solid var(--color-border, #6b7885);
          border-radius: 4px;
          background: var(--color-background, #fff);
          cursor: pointer;
        }

        .vlan-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .vlan-list label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .vlan-chip {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vlan-chip:hover {
          opacity: 0.8;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 400px;
          font-size: 1rem;
          color: var(--color-brew-black-60, #666);
          gap: 1rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background: var(--color-morning-blue, #1c7ff2);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-family: Inter;
        }

        .toolbar {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: var(--color-off-white, #faf9f5);
          border-bottom: 1px solid var(--color-border, #6b7885);
          align-items: center;
          flex-wrap: wrap;
        }

        .toolbar button,
        .toolbar select {
          height: 32px;
          padding: 0 12px;
          border: 1px solid var(--color-border, #6b7885);
          border-radius: 4px;
          background: var(--color-background, #fff);
          color: var(--color-text, #231f20);
          font-size: 0.875rem;
          cursor: pointer;
          font-family: Inter;
        }

        .toolbar button:hover,
        .toolbar select:hover {
          background: var(--color-brew-black-10, #f0f0f0);
        }

        .toolbar button:focus,
        .toolbar select:focus {
          outline: 2px solid var(--color-morning-blue, #1c7ff2);
          outline-offset: 2px;
        }

        .tooltip {
          position: absolute;
          background: var(--color-brew-black, #231f20);
          color: var(--color-off-white, #faf9f5);
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.875rem;
          pointer-events: none;
          z-index: 1000;
          white-space: pre-wrap;
          max-width: 300px;
        }

        @media (max-width: 768px) {
          .vlan-filter-panel {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
