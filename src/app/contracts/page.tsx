/**
 * Contracts List Page
 *
 * Enhanced with column management, per-column filtering, and URL persistence
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenericListView, ColumnConfig, Pagination } from '@/components/GenericListView'
import type { Contract, ContractType } from '@/types'

// Helper function to format contract type for display
function formatContractType(type: ContractType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Helper function to get contract type color
function getTypeColor(type: ContractType): string {
  const typeColors: Record<string, string> = {
    support: '#1C7FF2', // Morning Blue
    license: '#28C077', // Green
    service: '#ACD7FF', // Light Blue
    lease: '#FFBB5C', // Tangerine
    maintenance: '#FD6A3D', // Orange
    consulting: '#BCF46E', // Lime Green
  }
  return typeColors[type] || '#231F20'
}

// Helper function to check if contract is expiring soon (within 30 days)
function isExpiringSoon(endDate: Date | null): boolean {
  if (!endDate) return false
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return new Date(endDate) <= thirtyDaysFromNow && new Date(endDate) >= new Date()
}

// Helper function to check if contract is expired
function isExpired(endDate: Date | null): boolean {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

// Define ALL possible columns for contracts
const ALL_COLUMNS: ColumnConfig<Contract>[] = [
  {
    key: 'contract_name',
    label: 'Contract Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    alwaysVisible: true, // Can't hide contract name
    render: (contract) => contract.contract_name,
  },
  {
    key: 'contract_number',
    label: 'Contract Number',
    sortable: true,
    filterable: true,
    filterType: 'text',
    defaultVisible: true,
    render: (contract) => contract.contract_number || <span className="text-muted">—</span>,
  },
  {
    key: 'contract_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'support', label: 'Support' },
      { value: 'license', label: 'License' },
      { value: 'service', label: 'Service' },
      { value: 'lease', label: 'Lease' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'consulting', label: 'Consulting' },
    ],
    render: (contract) =>
      contract.contract_type ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getTypeColor(contract.contract_type),
            color:
              contract.contract_type === 'support' || contract.contract_type === 'maintenance'
                ? '#FAF9F5'
                : '#231F20',
          }}
        >
          {formatContractType(contract.contract_type)}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'start_date',
    label: 'Start Date',
    sortable: true,
    filterable: false,
    defaultVisible: true,
    render: (contract) =>
      contract.start_date ? (
        new Date(contract.start_date).toLocaleDateString()
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'end_date',
    label: 'End Date',
    sortable: true,
    filterable: false,
    defaultVisible: true,
    render: (contract) => {
      if (!contract.end_date) return <span className="text-muted">—</span>

      const expired = isExpired(contract.end_date)
      const expiringSoon = isExpiringSoon(contract.end_date)

      return (
        <span
          style={{
            color: expired ? '#FD6A3D' : expiringSoon ? '#FFBB5C' : 'inherit',
            fontWeight: expired || expiringSoon ? '600' : '400',
          }}
        >
          {new Date(contract.end_date).toLocaleDateString()}
          {expired && ' (Expired)'}
          {!expired && expiringSoon && ' (Expiring Soon)'}
        </span>
      )
    },
  },
  {
    key: 'cost',
    label: 'Cost',
    sortable: true,
    filterable: false,
    defaultVisible: true,
    render: (contract) =>
      contract.cost !== null && contract.cost !== undefined ? (
        formatCurrency(contract.cost)
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'billing_frequency',
    label: 'Billing Frequency',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (contract) => contract.billing_frequency || <span className="text-muted">—</span>,
  },
  {
    key: 'auto_renew',
    label: 'Auto-Renew',
    sortable: true,
    filterable: true,
    filterType: 'select',
    defaultVisible: true,
    filterOptions: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    render: (contract) => (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: contract.auto_renew ? '#28C077' : '#ACD7FF',
          color: contract.auto_renew ? '#FAF9F5' : '#231F20',
        }}
      >
        {contract.auto_renew ? 'Yes' : 'No'}
      </span>
    ),
  },
  {
    key: 'renewal_notice_days',
    label: 'Renewal Notice (Days)',
    sortable: false,
    filterable: false,
    defaultVisible: false,
    render: (contract) =>
      contract.renewal_notice_days ? (
        `${contract.renewal_notice_days} days`
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'notes',
    label: 'Notes',
    sortable: false,
    filterable: true,
    filterType: 'text',
    defaultVisible: false,
    render: (contract) =>
      contract.notes ? (
        <span
          style={{
            display: 'inline-block',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={contract.notes}
        >
          {contract.notes}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (contract) => new Date(contract.created_at).toLocaleDateString(),
  },
  {
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
    filterable: false,
    defaultVisible: false,
    render: (contract) => new Date(contract.updated_at).toLocaleDateString(),
  },
]

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [pagination] = useState<Pagination | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState('contract_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Fetch contracts from API
  const fetchContracts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (searchValue) {
        params.set('search', searchValue)
      }

      Object.entries(filterValues).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        }
      })

      const response = await fetch(`/api/contracts?${params}`)
      const result = await response.json()

      if (result.success) {
        setContracts(result.data)
      } else {
        console.error('Failed to fetch contracts:', result.message)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [searchValue, filterValues, sortBy, sortOrder])

  const handleAdd = () => {
    router.push('/contracts/new')
  }

  const handleRowClick = (contract: Contract) => {
    router.push(`/contracts/${contract.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) {
      return
    }

    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        await fetchContracts()
      } else {
        alert(`Failed to delete: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      alert('An error occurred while deleting the contract')
    }
  }

  return (
    <GenericListView<Contract>
      title="Contracts"
      description="Vendor agreements, licenses, support contracts, and service agreements"
      data={contracts}
      columns={ALL_COLUMNS}
      pagination={pagination}
      loading={loading}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      sortBy={sortBy}
      onSortChange={setSortBy}
      sortOrder={sortOrder}
      onSortOrderChange={setSortOrder}
      onAdd={handleAdd}
      onRowClick={handleRowClick}
      onDelete={handleDelete}
      searchPlaceholder="Search contracts by name or contract number..."
      emptyMessage="No contracts found. Add your first contract to get started."
    />
  )
}
