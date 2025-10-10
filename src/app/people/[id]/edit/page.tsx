/**
 * Edit Person Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { PersonForm } from '@/components/PersonForm'
import type { Person } from '@/types'

export default function EditPersonPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleSuccess = (person: Person) => {
    router.push(`/people/${person.id}`)
  }

  const handleCancel = () => {
    router.push(`/people/${id}`)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Person not found'}</div>
          <button onClick={() => router.push('/people')}>Back to People</button>
        </div>
      </div>
    )
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
          <Link
            href={`/people/${id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {person.full_name}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <PersonForm person={person} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
