/**
 * Miyoo Mini Plus Components Test Page
 * URL: /test/miyoo
 *
 * This page demonstrates the Miyoo pairing and device management UI
 */

import MiyooDevicesManager from '@/components/MiyooDevicesManager'

export default function MiyooTestPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#231F20] mb-2">Miyoo Mini Plus Integration</h1>
          <p className="text-gray-600">
            Manage your Miyoo Mini Plus devices and test the pairing functionality
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-[#ACD7FF] border-2 border-[#1C7FF2] rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-[#231F20] mb-2">About Miyoo Integration</h2>
          <p className="text-[#231F20] mb-4">
            The Miyoo Mini Plus integration allows you to view MOSS data directly on your handheld
            gaming console. Once paired, your device will have read-only access to all your IT
            assets, documentation, and network information.
          </p>
          <ul className="list-disc list-inside text-[#231F20] space-y-1 text-sm">
            <li>Generate a 6-digit pairing code from this page</li>
            <li>Enter the code on your Miyoo device within 10 minutes</li>
            <li>Your device will receive a read-only API token automatically</li>
            <li>You can revoke access at any time from this page</li>
          </ul>
        </div>

        {/* Devices Manager */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-[#6B7885] p-6">
          <MiyooDevicesManager />
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border-2 border-[#6B7885] p-6">
          <h2 className="text-xl font-semibold text-[#231F20] mb-4">API Endpoints</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-mono bg-[#FAF9F5] px-3 py-2 rounded border border-gray-300 mb-2">
                POST /api/miyoo/generate-pairing-code
              </div>
              <p className="text-gray-600">
                Generates a 6-digit pairing code (expires in 10 minutes)
              </p>
            </div>
            <div>
              <div className="font-mono bg-[#FAF9F5] px-3 py-2 rounded border border-gray-300 mb-2">
                POST /api/miyoo/pair
              </div>
              <p className="text-gray-600">
                Exchanges a pairing code for an API token (read-only scope)
              </p>
            </div>
            <div>
              <div className="font-mono bg-[#FAF9F5] px-3 py-2 rounded border border-gray-300 mb-2">
                GET /api/miyoo/devices
              </div>
              <p className="text-gray-600">Lists all paired Miyoo devices for the current user</p>
            </div>
            <div>
              <div className="font-mono bg-[#FAF9F5] px-3 py-2 rounded border border-gray-300 mb-2">
                DELETE /api/miyoo/devices?id=:id
              </div>
              <p className="text-gray-600">
                Revokes a device (deactivates device and its API token)
              </p>
            </div>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mt-8 bg-[#FFBB5C] border-2 border-[#FD6A3D] rounded-lg p-6">
          <h2 className="font-semibold text-[#231F20] mb-2">For Developers</h2>
          <p className="text-[#231F20] mb-3">
            The native Miyoo Mini Plus application is under development. The SDL2-based C++
            application will provide:
          </p>
          <ul className="list-disc list-inside text-[#231F20] space-y-1 text-sm">
            <li>640×480 optimized UI matching MOSS design system</li>
            <li>Controller-based navigation (D-pad, A/B/X/Y, L/R buttons)</li>
            <li>Offline caching of API responses</li>
            <li>Read-only access to all 16 core object types</li>
            <li>Search, filter, and relationship navigation</li>
          </ul>
          <p className="text-[#231F20] mt-3 text-sm">
            GitHub repo: <span className="font-mono bg-white px-2 py-1 rounded">moss-miyoo</span>{' '}
            (coming soon)
          </p>
        </div>
      </div>
    </div>
  )
}
