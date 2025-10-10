/**
 * Create Room Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RoomForm } from '@/components/RoomForm'
import type { Room } from '@/types'

export default function NewRoomPage() {
  const router = useRouter()

  const handleSuccess = (room: Room) => {
    router.push(`/rooms/${room.id}`)
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

        <RoomForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
