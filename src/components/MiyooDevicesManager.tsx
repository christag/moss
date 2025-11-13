'use client'

import { useState, useEffect } from 'react'
import MiyooPairingModal from './MiyooPairingModal'

interface MiyooDevice {
  id: string
  device_name: string
  device_serial: string | null
  token_prefix: string
  last_sync_at: string | null
  last_sync_ip: string | null
  sync_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function MiyooDevicesManager() {
  const [devices, setDevices] = useState<MiyooDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchDevices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/miyoo/devices')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch devices')
      }

      setDevices(data.devices || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const revokeDevice = async (deviceId: string) => {
    if (
      !confirm(
        'Are you sure you want to revoke this device? It will no longer be able to access MOSS.'
      )
    ) {
      return
    }

    setRevokingId(deviceId)

    try {
      const response = await fetch(`/api/miyoo/devices?id=${deviceId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to revoke device')
      }

      // Refresh the list
      await fetchDevices()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke device')
    } finally {
      setRevokingId(null)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#231F20] flex items-center gap-2">
          📱 Miyoo Mini Plus Devices
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchDevices}
            className="px-3 py-2 border-2 border-[#6B7885] text-[#231F20] rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setIsPairingModalOpen(true)}
            className="px-4 py-2 bg-[#1C7FF2] text-white rounded-lg hover:bg-[#1C7FF2]/90 flex items-center gap-2 font-semibold"
          >
            ➕ Add Device
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-[#E02D3C] text-[#E02D3C] px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Devices list */}
      {devices.length === 0 ? (
        <div className="text-center py-12 bg-[#FAF9F5] rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-3">📱</div>
          <p className="text-gray-600 mb-4">No Miyoo devices paired yet</p>
          <button
            onClick={() => setIsPairingModalOpen(true)}
            className="px-4 py-2 bg-[#1C7FF2] text-white rounded-lg hover:bg-[#1C7FF2]/90 font-semibold"
          >
            Pair Your First Device
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`p-4 border-2 rounded-lg ${
                device.is_active
                  ? 'border-[#6B7885] bg-white'
                  : 'border-gray-300 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#231F20]">{device.device_name}</h3>
                    {!device.is_active && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">Token:</span> {device.token_prefix}...
                    </div>
                    {device.last_sync_at && (
                      <div>
                        <span className="font-medium">Last sync:</span>{' '}
                        {new Date(device.last_sync_at).toLocaleString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Syncs:</span> {device.sync_count}
                    </div>
                    <div>
                      <span className="font-medium">Paired:</span>{' '}
                      {new Date(device.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {device.is_active && (
                  <button
                    onClick={() => revokeDevice(device.id)}
                    disabled={revokingId === device.id}
                    className="ml-4 px-3 py-2 text-[#FD6A3D] border-2 border-[#FD6A3D] rounded-lg hover:bg-[#FD6A3D] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Revoke device"
                  >
                    {revokingId === device.id ? '⏳' : '🗑️'} Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pairing Modal */}
      <MiyooPairingModal
        isOpen={isPairingModalOpen}
        onClose={() => {
          setIsPairingModalOpen(false)
          // Refresh devices list after pairing
          fetchDevices()
        }}
      />
    </div>
  )
}
