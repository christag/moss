/**
 * Admin Authentication Settings Page
 * Configure SSO, SAML, MFA, and authentication backend
 * PLACEHOLDER - To be implemented
 */

'use client'

export default function AuthenticationSettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Authentication Settings
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          Configure SSO, SAML, MFA, and user authentication backend
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-light-blue)',
          padding: 'var(--spacing-xl)',
          borderRadius: '8px',
          border: '1px solid var(--color-morning-blue)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🚧</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Under Construction</h2>
        </div>
        <p style={{ lineHeight: 1.6, marginBottom: 'var(--spacing-md)' }}>
          This section is planned for a future release. It will include:
        </p>
        <ul style={{ marginLeft: 'var(--spacing-lg)', lineHeight: 1.8 }}>
          <li>SAML 2.0 SSO configuration</li>
          <li>Identity Provider (IdP) integration</li>
          <li>Local vs remote user backend selection</li>
          <li>Multi-factor authentication (MFA) settings</li>
          <li>Password policy configuration</li>
          <li>Session management settings</li>
        </ul>
      </div>
    </div>
  )
}
