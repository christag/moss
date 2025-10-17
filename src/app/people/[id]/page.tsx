/**
 * Person Detail Page
 *
 * Shows detailed information about a specific person with relationship tabs
 * If viewing your own record, shows additional Account Settings tab
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { GenericDetailView, TabConfig, FieldGroup } from '@/components/GenericDetailView'
import { RelatedItemsList, RelatedColumn } from '@/components/RelatedItemsList'
import { Badge } from '@/components/ui/Badge'
import { AttachmentsTab } from '@/components/AttachmentsTab'
import { PasswordChangeForm } from '@/components/PasswordChangeForm'
import { ApiTokenManager } from '@/components/ApiTokenManager'
import type { Person, Company, Location, Device, Group } from '@/types'

export default function PersonDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()

  const [person, setPerson] = useState<Person | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [manager, setManager] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if viewing own profile
  const isOwnProfile = session?.user?.person_id === id

  // Fetch person data
  useEffect(() => {
    if (!id) return

    const fetchPerson = async () => {
      try {
        const response = await fetch(`/api/people/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch person')
        }
        const result = await response.json()
        setPerson(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPerson()
  }, [id])

  // Fetch related entities
  useEffect(() => {
    if (!person) return

    const fetchRelated = async () => {
      try {
        // Fetch company
        if (person.company_id) {
          const companyResponse = await fetch(`/api/companies/${person.company_id}`)
          if (companyResponse.ok) {
            const result = await companyResponse.json()
            setCompany(result.data)
          }
        }

        // Fetch location
        if (person.location_id) {
          const locationResponse = await fetch(`/api/locations/${person.location_id}`)
          if (locationResponse.ok) {
            const result = await locationResponse.json()
            setLocation(result.data)
          }
        }

        // Fetch manager
        if (person.manager_id) {
          const managerResponse = await fetch(`/api/people/${person.manager_id}`)
          if (managerResponse.ok) {
            const result = await managerResponse.json()
            setManager(result.data)
          }
        }
      } catch (err) {
        console.error('Error fetching related data:', err)
      }
    }

    fetchRelated()
  }, [person])

  const handleEdit = () => {
    router.push(`/people/${id}/edit`)
  }

  const handleBack = () => {
    router.push('/people')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this person? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/people/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete person')
      }

      toast.success('Person deleted successfully')
      router.push('/people')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete person')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error || 'Person not found'}</p>
        <button onClick={handleBack}>Back to People</button>
      </div>
    )
  }

  // Helper to format person type
  const formatPersonType = (type: string): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Helper to format date
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '—'
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return '—'
    }
  }

  // Define field groups for overview tab
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Full Name', value: person.full_name },
        { label: 'Email', value: person.email || '—' },
        { label: 'Username', value: person.username || '—' },
        {
          label: 'Person Type',
          value: (
            <Badge
              variant={
                person.person_type === 'employee'
                  ? 'blue'
                  : person.person_type === 'contractor'
                    ? 'purple'
                    : person.person_type === 'vendor_contact'
                      ? 'orange'
                      : 'default'
              }
            >
              {formatPersonType(person.person_type)}
            </Badge>
          ),
        },
        { label: 'Employee ID', value: person.employee_id || '—' },
      ],
    },
    {
      title: 'Job Details',
      fields: [
        { label: 'Job Title', value: person.job_title || '—' },
        { label: 'Department', value: person.department || '—' },
        {
          label: 'Manager',
          value: manager ? (
            <a
              href={`/people/${manager.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {manager.full_name}
            </a>
          ) : (
            '—'
          ),
        },
        { label: 'Start Date', value: formatDate(person.start_date) },
      ],
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Phone', value: person.phone || '—' },
        { label: 'Mobile', value: person.mobile || '—' },
        { label: 'Preferred Contact Method', value: person.preferred_contact_method || '—' },
      ],
    },
    {
      title: 'Location & Company',
      fields: [
        {
          label: 'Company',
          value: company ? (
            <a
              href={`/companies/${company.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {company.company_name}
            </a>
          ) : (
            '—'
          ),
        },
        {
          label: 'Location',
          value: location ? (
            <a
              href={`/locations/${location.id}`}
              style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
            >
              {location.location_name}
            </a>
          ) : (
            '—'
          ),
        },
      ],
    },
    {
      title: 'Notes',
      fields: [{ label: 'Notes', value: person.notes || '—', width: 'full' }],
    },
    {
      title: 'System Information',
      fields: [
        { label: 'Person ID', value: person.id },
        { label: 'Created', value: new Date(person.created_at).toLocaleString() },
        { label: 'Last Updated', value: new Date(person.updated_at).toLocaleString() },
      ],
    },
  ]

  // Define columns for related items
  const deviceColumns: RelatedColumn<Device>[] = [
    { key: 'hostname', label: 'Hostname' },
    {
      key: 'device_type',
      label: 'Type',
      render: (device) => {
        const typeMap: Record<string, string> = {
          computer: 'Computer',
          server: 'Server',
          mobile: 'Mobile',
          printer: 'Printer',
          switch: 'Switch',
          router: 'Router',
        }
        return typeMap[device.device_type] || device.device_type
      },
    },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'model', label: 'Model' },
    { key: 'serial_number', label: 'Serial Number' },
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
          {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
        </Badge>
      ),
      width: '100px',
    },
  ]

  const directReportColumns: RelatedColumn<Person>[] = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'job_title', label: 'Title' },
    { key: 'department', label: 'Department' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <Badge
          variant={
            p.status === 'active' ? 'success' : p.status === 'inactive' ? 'secondary' : 'default'
          }
        >
          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
        </Badge>
      ),
      width: '100px',
    },
  ]

  const groupColumns: RelatedColumn<Group>[] = [
    { key: 'group_name', label: 'Group Name' },
    {
      key: 'group_type',
      label: 'Type',
      render: (group) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          active_directory: { label: 'AD', color: 'blue' },
          okta: { label: 'Okta', color: 'purple' },
          google_workspace: { label: 'Google', color: 'green' },
          jamf_smart_group: { label: 'Jamf', color: 'orange' },
          custom: { label: 'Custom', color: 'gray' },
          security: { label: 'Security', color: 'red' },
        }
        const type = group.group_type ? typeMap[group.group_type] : null
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
    { key: 'description', label: 'Description' },
  ]

  // Define tabs
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <div>Overview content is rendered by GenericDetailView</div>,
    },
    // Show Account Settings tab only when viewing own profile
    ...(isOwnProfile
      ? [
          {
            id: 'account-settings',
            label: 'Account Settings',
            content: (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0.5rem' }}>
                    User Role
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--color-brew-black-60)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Your current system role
                  </p>
                  <Badge
                    variant={
                      session?.user?.role === 'super_admin'
                        ? 'green'
                        : session?.user?.role === 'admin'
                          ? 'blue'
                          : 'default'
                    }
                  >
                    {session?.user?.role === 'super_admin'
                      ? 'Super Admin'
                      : session?.user?.role === 'admin'
                        ? 'Admin'
                        : 'User'}
                  </Badge>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                  <PasswordChangeForm />
                </div>
              </div>
            ),
          },
          {
            id: 'api-tokens',
            label: 'API Tokens',
            content: (
              <div style={{ padding: '1.5rem' }}>
                <ApiTokenManager />
              </div>
            ),
          },
        ]
      : []),
    {
      id: 'devices',
      label: 'Assigned Devices',
      content: (
        <RelatedItemsList<Device>
          apiEndpoint={`/api/devices?assigned_to_id=${id}`}
          columns={deviceColumns}
          linkPattern="/devices/:id"
          addButtonLabel="Assign Device"
          onAdd={() => router.push(`/devices/new?assigned_to_id=${id}`)}
          emptyMessage="No devices assigned to this person"
          limit={50}
        />
      ),
    },
    {
      id: 'direct-reports',
      label: 'Direct Reports',
      content: (
        <RelatedItemsList<Person>
          apiEndpoint={`/api/people?manager_id=${id}`}
          columns={directReportColumns}
          linkPattern="/people/:id"
          emptyMessage="No direct reports for this person"
          limit={50}
        />
      ),
    },
    {
      id: 'groups',
      label: 'Groups',
      content: (
        <RelatedItemsList<Group>
          apiEndpoint={`/api/people/${id}/groups`}
          columns={groupColumns}
          linkPattern="/groups/:id"
          emptyMessage="Not a member of any groups"
          limit={50}
        />
      ),
    },
    {
      id: 'attachments',
      label: 'Attachments',
      content: <AttachmentsTab objectType="person" objectId={id} canEdit={true} />,
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <div className="tab-content">
          <p className="text-muted">Change history for this person will appear here.</p>
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
        title={person.full_name}
        subtitle={person.job_title || formatPersonType(person.person_type)}
        status={person.status}
        breadcrumbs={[{ label: 'People', href: '/people' }, { label: person.full_name }]}
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
