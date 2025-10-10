/**
 * New Group Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GroupForm } from '@/components/GroupForm'
import type { Group } from '@/types'

export default function NewGroupPage() {
  const router = useRouter()

  const handleSuccess = (group: Group) => {
    router.push(`/groups/${group.id}`)
  }

  const handleCancel = () => {
    router.push('/groups')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <GroupForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
