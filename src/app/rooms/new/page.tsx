/**
 * Create Room Page
 */
'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { RoomForm } from '@/components/RoomForm'

export default function NewRoomPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent location_id from query params if provided
  const location_id = searchParams.get('location_id')
  const initialValues = location_id ? { location_id } : {}

  const handleSuccess = (room: unknown) => {
    const roomData = room as { id: string }
    router.push(`/rooms/${roomData.id}`)
  }

  const handleCancel = () => {
    router.push('/rooms')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/rooms" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Rooms
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New Room</span>
        </nav>

        <RoomForm initialValues={initialValues} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
