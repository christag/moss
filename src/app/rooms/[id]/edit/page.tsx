/**
 * Edit Room Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { RoomForm } from '@/components/RoomForm'
import type { Room } from '@/types'

export default function EditRoomPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch room')
        }
        const result = await response.json()
        setRoom(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [id])

  const handleSuccess = (room: Room) => {
    router.push(`/rooms/${room.id}`)
  }

  const handleCancel = () => {
    router.push(`/rooms/${id}`)
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

  if (error || !room) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Room not found'}</div>
          <button onClick={() => router.push('/rooms')}>Back to Rooms</button>
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
          <Link href="/rooms" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Rooms
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <Link
            href={`/rooms/${id}`}
            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
          >
            {room.room_name}
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>Edit</span>
        </nav>

        <RoomForm room={room} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
