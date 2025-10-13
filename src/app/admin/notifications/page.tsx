/**
 * Admin Notifications Page
 * Configure email notifications and alerts
 * PLACEHOLDER - To be implemented
 */

'use client'

export default function NotificationsPage() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
        Notification Settings
      </h1>
      <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-xl)' }}>
        Configure email notifications, alerts, and SMTP settings
      </p>
      <div
        style={{
          backgroundColor: 'var(--color-light-blue)',
          padding: 'var(--spacing-xl)',
          borderRadius: '8px',
          border: '1px solid var(--color-morning-blue)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          🚧 Under Construction
        </h2>
        <p style={{ marginBottom: 'var(--spacing-md)' }}>Future features:</p>
        <ul style={{ marginLeft: 'var(--spacing-lg)', lineHeight: 1.8 }}>
          <li>SMTP server configuration</li>
          <li>Email template customization</li>
          <li>Notification preferences (warranty expiration, license renewal, etc.)</li>
          <li>Alert thresholds and triggers</li>
          <li>Notification delivery logs</li>
        </ul>
      </div>
    </div>
  )
}
