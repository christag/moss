/**
 * Create Person Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PersonForm } from '@/components/PersonForm'
import type { Person } from '@/types'

export default function NewPersonPage() {
  const router = useRouter()

  const handleSuccess = (person: Person) => {
    router.push(`/people/${person.id}`)
  }

  const handleCancel = () => {
    router.push('/people')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/people" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            People
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New Person</span>
        </nav>

        <PersonForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
