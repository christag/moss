/**
 * Company Detail Page
 *
 * Shows detailed information about a specific company
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import { RelatedItemsList, RelatedColumn } from '@/components/RelatedItemsList'
import { Icon } from '@/components/ui'
import { AttachmentsTab } from '@/components/AttachmentsTab'
import { Badge } from '@/components/ui/Badge'
import type { Company, Location, Person, Device, Contract } from '@/types'

export default function CompanyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch company data
  useEffect(() => {
    if (!id) return

    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch company')
        }
        const result = await response.json()
        setCompany(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [id])

  const handleEdit = () => {
    router.push(`/companies/${id}/edit`)
  }

  const handleBack = () => {
    router.push('/companies')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        // Extract detailed error message from API response
        // API structure: { success: false, error: "main error", details: { message: "detailed message", dependencies: {...} } }
        const errorMessage =
          result.details?.message || result.error || result.message || 'Failed to delete company'
        toast.error(errorMessage)
        return
      }

      toast.success('Company deleted successfully')
      router.push('/companies')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete company')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Company not found'}</p>
        <button onClick={handleBack}>Back to Companies</button>
      </div>
    )
  }

  // Define columns for related items
  const locationColumns: RelatedColumn<Location>[] = [
    { key: 'location_name', label: 'Location Name' },
    {
      key: 'location_type',
      label: 'Type',
      render: (loc) => {
        const typeMap: Record<string, string> = {
          office: 'Office',
          datacenter: 'Data Center',
          colo: 'Colocation',
          remote: 'Remote',
          warehouse: 'Warehouse',
          studio: 'Studio',
          broadcast_facility: 'Broadcast Facility',
        }
        return loc.location_type ? typeMap[loc.location_type] || loc.location_type : '—'
      },
      width: '150px',
    },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State', width: '100px' },
    { key: 'country', label: 'Country', width: '120px' },
  ]

  const peopleColumns: RelatedColumn<Person>[] = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'person_type',
      label: 'Type',
      render: (person) => {
        const typeMap: Record<string, string> = {
          employee: 'Employee',
          contractor: 'Contractor',
          vendor_contact: 'Vendor Contact',
          partner: 'Partner',
          customer: 'Customer',
          other: 'Other',
        }
        return person.person_type ? typeMap[person.person_type] || person.person_type : '—'
      },
      width: '150px',
    },
    { key: 'job_title', label: 'Job Title' },
    {
      key: 'status',
      label: 'Status',
      render: (person) => (
        <Badge
          variant={
            person.status === 'active'
              ? 'success'
              : person.status === 'terminated'
                ? 'error'
                : 'default'
          }
        >
          {person.status?.charAt(0).toUpperCase() + person.status?.slice(1)}
        </Badge>
      ),
      width: '100px',
    },
  ]

  const deviceColumns: RelatedColumn<Device>[] = [
    { key: 'hostname', label: 'Hostname' },
    {
      key: 'device_type',
      label: 'Type',
      render: (device) => {
        const typeMap: Record<string, string> = {
          computer: 'Computer',
          server: 'Server',
          switch: 'Switch',
          router: 'Router',
          firewall: 'Firewall',
          printer: 'Printer',
          mobile: 'Mobile',
          av_equipment: 'AV Equipment',
          broadcast_equipment: 'Broadcast Equipment',
        }
        return device.device_type ? typeMap[device.device_type] || device.device_type : '—'
      },
      width: '150px',
    },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'model', label: 'Model' },
    {
      key: 'status',
      label: 'Status',
      render: (device) => (
        <Badge
          variant={
            device.status === 'active'
              ? 'success'
              : device.status === 'repair'
                ? 'warning'
                : 'default'
          }
        >
          {device.status?.charAt(0).toUpperCase() + device.status?.slice(1)}
        </Badge>
      ),
      width: '100px',
    },
  ]

  const contractColumns: RelatedColumn<Contract>[] = [
    { key: 'contract_name', label: 'Contract Name' },
    {
      key: 'contract_type',
      label: 'Type',
      render: (contract) => {
        const typeMap: Record<string, string> = {
          purchase: 'Purchase',
          lease: 'Lease',
          support: 'Support',
          saas: 'SaaS',
          maintenance: 'Maintenance',
          service: 'Service',
          licensing: 'Licensing',
          other: 'Other',
        }
        return contract.contract_type
          ? typeMap[contract.contract_type] || contract.contract_type
          : '—'
      },
      width: '150px',
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (contract) =>
        contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '—',
      width: '120px',
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (contract) =>
        contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '—',
      width: '120px',
    },
    {
      key: 'end_date',
      label: 'Status',
      render: (contract) => {
        // Compute status based on dates
        const now = new Date()
        const startDate = contract.start_date ? new Date(contract.start_date) : null
        const endDate = contract.end_date ? new Date(contract.end_date) : null

        let status = 'unknown'
        let variant: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default'

        if (!startDate && !endDate) {
          status = 'no dates'
          variant = 'default'
        } else if (endDate && endDate < now) {
          status = 'expired'
          variant = 'error'
        } else if (startDate && startDate > now) {
          status = 'upcoming'
          variant = 'info'
        } else {
          status = 'active'
          variant = 'success'
        }

        return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
      },
      width: '100px',
    },
  ]

  // Define field groups for overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Company Name', value: company.company_name },
        {
          label: 'Company Type',
          value:
            {
              own_organization: 'Own Organization',
              vendor: 'Vendor',
              manufacturer: 'Manufacturer',
              service_provider: 'Service Provider',
              partner: 'Partner',
              customer: 'Customer',
              other: 'Other',
            }[company.company_type] || company.company_type,
        },
        {
          label: 'Website',
          value: company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-morning-blue)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {company.website}
              <Icon name="external_link" size={14} aria-label="Opens in new tab" />
            </a>
          ) : (
            '—'
          ),
        },
      ],
    },
    {
      title: 'Additional Information',
      fields: [{ label: 'Notes', value: company.notes || '—' }],
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Company ID', value: company.id },
        {
          label: 'Created',
          value: new Date(company.created_at).toLocaleString(),
        },
        {
          label: 'Last Updated',
          value: new Date(company.updated_at).toLocaleString(),
        },
      ],
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
      id: 'locations',
      label: 'Locations',
      content: (
        <RelatedItemsList<Location>
          apiEndpoint={`/api/locations?company_id=${id}`}
          columns={locationColumns}
          linkPattern="/locations/:id"
          addButtonLabel="Add Location"
          onAdd={() => router.push(`/locations/new?company_id=${id}`)}
          emptyMessage="No locations associated with this company"
          limit={50}
        />
      ),
    },
    {
      id: 'people',
      label: 'People',
      content: (
        <RelatedItemsList<Person>
          apiEndpoint={`/api/people?company_id=${id}`}
          columns={peopleColumns}
          linkPattern="/people/:id"
          addButtonLabel="Add Person"
          onAdd={() => router.push(`/people/new?company_id=${id}`)}
          emptyMessage="No people associated with this company"
          limit={50}
        />
      ),
    },
    {
      id: 'devices',
      label: 'Devices',
      content: (
        <RelatedItemsList<Device>
          apiEndpoint={`/api/devices?company_id=${id}`}
          columns={deviceColumns}
          linkPattern="/devices/:id"
          addButtonLabel="Add Device"
          onAdd={() => router.push(`/devices/new?company_id=${id}`)}
          emptyMessage="No devices associated with this company"
          limit={50}
        />
      ),
    },
    {
      id: 'contracts',
      label: 'Contracts',
      content: (
        <RelatedItemsList<Contract>
          apiEndpoint={`/api/contracts?company_id=${id}`}
          columns={contractColumns}
          linkPattern="/contracts/:id"
          addButtonLabel="Add Contract"
          onAdd={() => router.push(`/contracts/new?company_id=${id}`)}
          emptyMessage="No contracts with this company"
          limit={50}
        />
      ),
    },
    {
      id: 'attachments',
      label: 'Attachments',
      content: <AttachmentsTab objectType="company" objectId={id} canEdit={true} />,
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this company will appear here.</p>
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
        title={company.company_name}
        subtitle="Company"
        breadcrumbs={[{ label: 'Companies', href: '/companies' }, { label: company.company_name }]}
        tabs={tabs}
        fieldGroups={fieldGroups}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
