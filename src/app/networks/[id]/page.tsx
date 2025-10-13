/**
 * Network Detail Page
 *
 * Shows detailed information about a specific network with relationship tabs
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import { RelatedItemsList, RelatedColumn } from '@/components/RelatedItemsList'
import { Badge } from '@/components/ui/Badge'
import { AttachmentsTab } from '@/components/AttachmentsTab'
import { SubnetVisualization } from '@/components/SubnetVisualization'
import type { Network, IO, IPAddress, Device } from '@/types'

export default function NetworkDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [network, setNetwork] = useState<Network | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch network data
  useEffect(() => {
    if (!id) return

    const fetchNetwork = async () => {
      try {
        const response = await fetch(`/api/networks/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch network')
        }
        const result = await response.json()
        setNetwork(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchNetwork()
  }, [id])

  const handleEdit = () => {
    router.push(`/networks/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this network? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/networks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete network')
      }

      toast.success('Network deleted successfully')
      router.push('/networks')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete network')
    }
  }

  const handleBack = () => {
    router.push('/networks')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error || !network) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Network not found'}</p>
        <button onClick={handleBack}>Back to Networks</button>
      </div>
    )
  }

  // Helper to format network type
  const formatNetworkType = (type: string | null): string => {
    if (!type) return '—'
    const typeMap: Record<string, string> = {
      lan: 'LAN',
      wan: 'WAN',
      dmz: 'DMZ',
      guest: 'Guest',
      management: 'Management',
      storage: 'Storage',
      production: 'Production',
      broadcast: 'Broadcast',
    }
    return typeMap[type] || type
  }

  // Define field groups for overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Network Name', value: network.network_name },
        { label: 'Network Type', value: formatNetworkType(network.network_type) },
        { label: 'Network Address', value: network.network_address || '—' },
        { label: 'VLAN ID', value: network.vlan_id?.toString() || '—' },
      ],
    },
    {
      title: 'Network Configuration',
      fields: [
        { label: 'Gateway', value: network.gateway || '—' },
        { label: 'Subnet Mask', value: network.subnet_mask || '—' },
        { label: 'DNS Servers', value: network.dns_servers || '—' },
      ],
    },
    {
      title: 'DHCP Configuration',
      fields: [
        {
          label: 'DHCP Enabled',
          value: network.dhcp_enabled ? (
            <Badge variant="success">Yes</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          ),
        },
        { label: 'DHCP Range Start', value: network.dhcp_range_start || '—' },
        { label: 'DHCP Range End', value: network.dhcp_range_end || '—' },
      ],
    },
    {
      title: 'Description & Notes',
      fields: [
        { label: 'Description', value: network.description || '—', width: 'full' },
        { label: 'Notes', value: network.notes || '—', width: 'full' },
      ],
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Network ID', value: network.id },
        { label: 'Created', value: new Date(network.created_at).toLocaleString() },
        { label: 'Last Updated', value: new Date(network.updated_at).toLocaleString() },
      ],
    },
  ]

  // Define columns for related items
  const ioColumns: RelatedColumn<IO>[] = [
    { key: 'interface_name', label: 'Interface Name' },
    {
      key: 'device_id',
      label: 'Device',
      render: (io) => {
        // Note: In a real implementation, we'd fetch device info or join in the API
        return io.device_id || '—'
      },
    },
    { key: 'port_number', label: 'Port #', width: '100px' },
    {
      key: 'interface_type',
      label: 'Type',
      render: (io) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          ethernet: { label: 'Ethernet', color: 'blue' },
          fiber: { label: 'Fiber', color: 'purple' },
          wifi: { label: 'WiFi', color: 'green' },
        }
        const type = io.interface_type ? typeMap[io.interface_type] : null
        return type ? (
          <Badge variant={type.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {type.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '120px',
    },
    {
      key: 'trunk_mode',
      label: 'Mode',
      render: (io) => {
        const modeMap: Record<string, { label: string; color: string }> = {
          access: { label: 'Access', color: 'blue' },
          trunk: { label: 'Trunk', color: 'purple' },
          hybrid: { label: 'Hybrid', color: 'orange' },
        }
        const mode = io.trunk_mode ? modeMap[io.trunk_mode] : null
        return mode ? (
          <Badge variant={mode.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {mode.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '100px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (io) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          active: { label: 'Active', color: 'success' },
          inactive: { label: 'Inactive', color: 'secondary' },
          down: { label: 'Down', color: 'warning' },
          disabled: { label: 'Disabled', color: 'default' },
        }
        const status = io.status ? statusMap[io.status] : null
        return status ? (
          <Badge variant={status.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {status.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '100px',
    },
  ]

  const ipAddressColumns: RelatedColumn<IPAddress>[] = [
    { key: 'ip_address', label: 'IP Address' },
    { key: 'hostname', label: 'Hostname' },
    {
      key: 'ip_type',
      label: 'Type',
      render: (ip) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          static: { label: 'Static', color: 'blue' },
          dhcp: { label: 'DHCP', color: 'green' },
          reserved: { label: 'Reserved', color: 'purple' },
        }
        const type = ip.ip_type ? typeMap[ip.ip_type] : null
        return type ? (
          <Badge variant={type.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {type.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '100px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (ip) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          active: { label: 'Active', color: 'success' },
          inactive: { label: 'Inactive', color: 'secondary' },
          reserved: { label: 'Reserved', color: 'warning' },
          conflict: { label: 'Conflict', color: 'error' },
        }
        const status = ip.status ? statusMap[ip.status] : null
        return status ? (
          <Badge variant={status.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {status.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '100px',
    },
  ]

  const deviceColumns: RelatedColumn<Device>[] = [
    { key: 'hostname', label: 'Hostname' },
    {
      key: 'device_type',
      label: 'Type',
      render: (device) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          computer: { label: 'Computer', color: 'blue' },
          server: { label: 'Server', color: 'purple' },
          switch: { label: 'Switch', color: 'green' },
          router: { label: 'Router', color: 'orange' },
          firewall: { label: 'Firewall', color: 'red' },
          printer: { label: 'Printer', color: 'gray' },
        }
        const type = device.device_type ? typeMap[device.device_type] : null
        return type ? (
          <Badge variant={type.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {type.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '120px',
    },
    { key: 'model', label: 'Model' },
    { key: 'serial_number', label: 'Serial Number' },
    {
      key: 'status',
      label: 'Status',
      render: (device) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          active: { label: 'Active', color: 'success' },
          inactive: { label: 'Inactive', color: 'secondary' },
          retired: { label: 'Retired', color: 'default' },
          repair: { label: 'Repair', color: 'warning' },
        }
        const status = device.status ? statusMap[device.status] : null
        return status ? (
          <Badge variant={status.color as 'default' | 'success' | 'warning' | 'error' | 'info'}>
            {status.label}
          </Badge>
        ) : (
          '—'
        )
      },
      width: '100px',
    },
  ]

  // Define tabs
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <div>Overview content is rendered by GenericDetailView</div>,
    },
    {
      id: 'ios',
      label: 'Interfaces',
      content: (
        <RelatedItemsList<IO>
          apiEndpoint={`/api/ios?native_network_id=${id}`}
          columns={ioColumns}
          linkPattern="/ios/:id"
          addButtonLabel="Add Interface"
          onAdd={() => router.push(`/ios/new?native_network_id=${id}`)}
          emptyMessage="No interfaces using this network as native VLAN"
          limit={50}
        />
      ),
    },
    {
      id: 'subnet-visual',
      label: 'Subnet Map',
      content: <SubnetVisualization networkId={id} />,
    },
    {
      id: 'ip-addresses',
      label: 'IP Addresses',
      content: (
        <RelatedItemsList<IPAddress>
          apiEndpoint={`/api/ip-addresses?network_id=${id}`}
          columns={ipAddressColumns}
          linkPattern="/ip-addresses/:id"
          addButtonLabel="Add IP Address"
          onAdd={() => router.push(`/ip-addresses/new?network_id=${id}`)}
          emptyMessage="No IP addresses allocated from this network"
          limit={50}
        />
      ),
    },
    {
      id: 'devices',
      label: 'Devices',
      content: (
        <RelatedItemsList<Device>
          apiEndpoint={`/api/devices?network_id=${id}`}
          columns={deviceColumns}
          linkPattern="/devices/:id"
          emptyMessage="No devices connected to this network"
          limit={50}
        />
      ),
    },
    {
      id: 'attachments',
      label: 'Attachments',
      content: <AttachmentsTab objectType="network" objectId={id} canEdit={true} />,
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this network will appear here.</p>
          <p className="text-muted">
            <em>Audit log functionality coming soon...</em>
          </p>
        </div>
      ),
    },
  ]

  return (
    <>
      <GenericDetailView
        title={network.network_name}
        subtitle={formatNetworkType(network.network_type)}
        breadcrumbs={[{ label: 'Networks', href: '/networks' }, { label: network.network_name }]}
        tabs={tabs}
        fieldGroups={fieldGroups}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />

      <style jsx global>{`
        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
        }

        .loading-spinner {
          font-size: 1.2rem;
          color: var(--color-brew-black-60);
        }

        .error-container h1 {
          color: var(--color-orange);
          margin-bottom: 1rem;
        }

        .error-container p {
          margin-bottom: 1.5rem;
          color: var(--color-brew-black-60);
        }

        .error-container button {
          padding: 0.75rem 1.5rem;
          background: var(--color-morning-blue);
          color: var(--color-off-white);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .error-container button:hover {
          opacity: 0.9;
        }

        .tab-content {
          padding: 2rem;
        }

        .text-muted {
          color: var(--color-brew-black-60);
          line-height: 1.6;
        }
      `}</style>
    </>
  )
}
