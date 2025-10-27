/**
 * Dashboard Homepage
 * Main dashboard with overview statistics and expiring items
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import StatWidget from '@/components/dashboard/StatWidget'
import ExpiringItemsWidget from '@/components/dashboard/ExpiringItemsWidget'
import { PageTransition } from '@/components/animations/PageTransition'

interface DashboardStats {
  devices: number
  people: number
  locations: number
  networks: number
  software: number
  saas_services: number
  documents: number
  contracts: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h1>
          <p style={{ color: 'var(--color-brew-black-60)' }}>
            Here&apos;s what&apos;s happening with your IT infrastructure today.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          {loading ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-brew-black-60)',
              }}
            >
              Loading statistics...
            </div>
          ) : stats ? (
            <>
              <StatWidget
                title="Devices"
                value={stats.devices}
                icon="toggle_on_off"
                color="var(--color-morning-blue)"
                link="/devices"
                description="Total managed devices"
              />
              <StatWidget
                title="People"
                value={stats.people}
                icon="people-group"
                color="var(--color-morning-blue)"
                link="/people"
                description="Total users and contacts"
              />
              <StatWidget
                title="Locations"
                value={stats.locations}
                icon="location-pin"
                color="var(--color-morning-blue)"
                link="/locations"
                description="Physical locations"
              />
              <StatWidget
                title="Networks"
                value={stats.networks}
                icon="map"
                color="var(--color-morning-blue)"
                link="/networks"
                description="VLANs and subnets"
              />
              <StatWidget
                title="Software"
                value={stats.software}
                icon="bar_code_sku"
                color="var(--color-morning-blue)"
                link="/software"
                description="Software catalog items"
              />
              <StatWidget
                title="SaaS Services"
                value={stats.saas_services}
                icon="up-arrow-line-chart"
                color="var(--color-morning-blue)"
                link="/saas-services"
                description="Cloud services"
              />
              <StatWidget
                title="Documents"
                value={stats.documents}
                icon="folder_drawer_category"
                color="var(--color-morning-blue)"
                link="/documents"
                description="Documentation pages"
              />
              <StatWidget
                title="Contracts"
                value={stats.contracts}
                icon="ticket-event-stub"
                color="var(--color-orange)"
                link="/contracts"
                description="Active contracts"
              />
            </>
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-orange)',
              }}
            >
              Failed to load statistics
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-md)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
            Quick Actions
          </h2>
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/devices/new"
              style={{
                display: 'inline-block',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-morning-blue)',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              + Add Device
            </Link>
            <Link
              href="/people/new"
              style={{
                display: 'inline-block',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-green)',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              + Add Person
            </Link>
            <Link
              href="/locations/new"
              style={{
                display: 'inline-block',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-tangerine)',
                color: 'var(--color-brew-black)',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              + Add Location
            </Link>
            <Link
              href="/networks/new"
              style={{
                display: 'inline-block',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'var(--color-light-blue)',
                color: 'var(--color-brew-black)',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              + Add Network
            </Link>
          </div>
        </div>

        {/* Expiring Items Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <ExpiringItemsWidget
            title="Expiring Warranties"
            apiEndpoint="/api/dashboard/expiring-warranties"
            columns={[
              {
                key: 'device_name',
                label: 'Device',
                render: (item) => (
                  <Link
                    href={`/devices/${item.id}`}
                    style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
                  >
                    {item.device_name}
                  </Link>
                ),
              },
              { key: 'manufacturer', label: 'Manufacturer' },
            ]}
            linkPattern="/devices/:id"
            emptyMessage="No warranties expiring in the next 90 days"
            days={90}
            limit={5}
          />

          <ExpiringItemsWidget
            title="Expiring Licenses"
            apiEndpoint="/api/dashboard/expiring-licenses"
            columns={[
              {
                key: 'license_name',
                label: 'License',
                render: (item) => (
                  <Link
                    href={`/software-licenses/${item.id}`}
                    style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
                  >
                    {item.license_name}
                  </Link>
                ),
              },
              {
                key: 'utilization_percentage',
                label: 'Utilization',
                render: (item) => `${item.utilization_percentage}%`,
              },
            ]}
            linkPattern="/software-licenses/:id"
            emptyMessage="No licenses expiring in the next 90 days"
            days={90}
            limit={5}
          />

          <ExpiringItemsWidget
            title="Expiring Contracts"
            apiEndpoint="/api/dashboard/expiring-contracts"
            columns={[
              {
                key: 'contract_title',
                label: 'Contract',
                render: (item) => (
                  <Link
                    href={`/contracts/${item.id}`}
                    style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
                  >
                    {item.contract_title}
                  </Link>
                ),
              },
              { key: 'vendor', label: 'Vendor' },
            ]}
            linkPattern="/contracts/:id"
            emptyMessage="No contracts expiring in the next 90 days"
            days={90}
            limit={5}
          />
        </div>
      </div>
    </PageTransition>
  )
}
