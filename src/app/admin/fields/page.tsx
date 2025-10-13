/**
 * Admin Custom Fields Page
 * Manage custom fields and dropdown values
 * PLACEHOLDER - To be implemented
 */

'use client'

export default function FieldsPage() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
        Custom Fields
      </h1>
      <p style={{ color: 'var(--color-brew-black-60)', marginBottom: 'var(--spacing-xl)' }}>
        Manage custom fields and dropdown values for objects
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
          <li>Create custom fields for any object type</li>
          <li>Edit dropdown values for existing fields</li>
          <li>Field types: text, number, select, multi-select, date, checkbox</li>
          <li>Required vs optional fields</li>
          <li>Field display order management</li>
        </ul>
      </div>
    </div>
  )
}
