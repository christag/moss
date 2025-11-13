'use client'

import { useState } from 'react'

interface MiyooPairingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MiyooPairingModal({ isOpen, onClose }: MiyooPairingModalProps) {
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateCode = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/miyoo/generate-pairing-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate pairing code')
      }

      setPairingCode(data.code)
      setExpiresAt(data.expiresAt)

      // Auto-refresh code after 10 minutes (before expiration)
      setTimeout(
        () => {
          setPairingCode(null)
          setExpiresAt(null)
        },
        10 * 60 * 1000
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPairingCode(null)
    setExpiresAt(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-[#231F20] mb-2">Pair Miyoo Mini Plus Device</h2>
        <p className="text-gray-600 mb-6">
          Generate a 6-digit code to connect your Miyoo Mini Plus to MOSS
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-[#E02D3C] text-[#E02D3C] px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Pairing code display */}
        {pairingCode ? (
          <div className="text-center mb-6">
            <div className="bg-[#FAF9F5] border-2 border-[#1C7FF2] rounded-lg p-6 mb-4">
              <div className="text-sm text-gray-600 mb-2">Enter this code on your Miyoo:</div>
              <div className="text-6xl font-bold text-[#231F20] tracking-widest font-mono">
                {pairingCode}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Code expires in 10 minutes
              {expiresAt && (
                <>
                  <br />
                  at {new Date(expiresAt).toLocaleTimeString()}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Click the button below to generate a pairing code. You&apos;ll have 10 minutes to
              enter it on your Miyoo device.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {pairingCode ? (
            <>
              <button
                onClick={generateCode}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-[#6B7885] text-[#231F20] rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate New Code
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-[#231F20] text-[#FAF9F5] rounded-lg hover:bg-[#231F20]/90 font-semibold"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 border-2 border-[#6B7885] text-[#231F20] rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={generateCode}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[#1C7FF2] text-white rounded-lg hover:bg-[#1C7FF2]/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Code'}
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-[#231F20] mb-2">How to pair:</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Turn on your Miyoo Mini Plus device</li>
            <li>Launch the MOSS app</li>
            <li>Select &quot;Add Server&quot; or &quot;Pair Device&quot;</li>
            <li>Enter the 6-digit code shown above</li>
            <li>Your device will connect automatically</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
