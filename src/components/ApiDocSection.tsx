/**
 * ApiDocSection Component
 * Reusable section component for API documentation pages
 */
'use client'

interface ApiDocSectionProps {
  id?: string
  title: string
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export function ApiDocSection({ id, title, children, variant = 'default' }: ApiDocSectionProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          borderColor: 'var(--color-green)',
          headerBg: 'rgba(40, 192, 119, 0.05)',
        }
      case 'warning':
        return {
          borderColor: 'var(--color-tangerine)',
          headerBg: 'rgba(255, 187, 92, 0.05)',
        }
      case 'error':
        return {
          borderColor: 'var(--color-orange)',
          headerBg: 'rgba(253, 106, 61, 0.05)',
        }
      case 'info':
        return {
          borderColor: 'var(--color-light-blue)',
          headerBg: 'rgba(172, 215, 255, 0.05)',
        }
      default:
        return {
          borderColor: 'var(--color-border)',
          headerBg: 'rgba(28, 127, 242, 0.03)',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <section
      id={id}
      style={{
        marginBottom: 'var(--spacing-2xl)',
        border: `1px solid ${styles.borderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 'var(--spacing-md)',
          backgroundColor: styles.headerBg,
          borderBottom: `1px solid ${styles.borderColor}`,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-black)' }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: 'var(--spacing-md)' }}>{children}</div>
    </section>
  )
}

/**
 * MethodBadge Component
 * Displays HTTP method with appropriate color
 */
interface MethodBadgeProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  size?: 'sm' | 'md' | 'lg'
}

export function MethodBadge({ method, size = 'md' }: MethodBadgeProps) {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'var(--color-blue)'
      case 'POST':
        return 'var(--color-green)'
      case 'PUT':
        return 'var(--color-tangerine)'
      case 'DELETE':
        return 'var(--color-orange)'
      case 'PATCH':
        return 'var(--color-lime-green)'
      default:
        return 'var(--color-black)'
    }
  }

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 'var(--font-size-xs)'
      case 'lg':
        return 'var(--font-size-lg)'
      default:
        return 'var(--font-size-sm)'
    }
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: size === 'sm' ? 'var(--spacing-xs)' : 'var(--spacing-xs) var(--spacing-sm)',
        backgroundColor: getMethodColor(method),
        color:
          method === 'PUT' || method === 'PATCH' ? 'var(--color-black)' : 'var(--color-off-white)',
        fontWeight: 'var(--font-weight-bold)',
        fontSize: getFontSize(),
        borderRadius: '4px',
        fontFamily: "'Fira Code', monospace",
        letterSpacing: '0.05em',
      }}
    >
      {method}
    </span>
  )
}

/**
 * StatusBadge Component
 * Displays HTTP status code with appropriate color
 */
interface StatusBadgeProps {
  status: number
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'var(--color-green)'
    if (status >= 300 && status < 400) return 'var(--color-light-blue)'
    if (status >= 400 && status < 500) return 'var(--color-tangerine)'
    if (status >= 500) return 'var(--color-orange)'
    return 'var(--color-black)'
  }

  const needsBlackText = status >= 300 && status < 400

  return (
    <span
      style={{
        display: 'inline-block',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        backgroundColor: getStatusColor(status),
        color: needsBlackText ? 'var(--color-black)' : 'var(--color-off-white)',
        fontWeight: 'var(--font-weight-bold)',
        fontSize: 'var(--font-size-sm)',
        borderRadius: '4px',
        fontFamily: "'Fira Code', monospace",
      }}
    >
      {status}
    </span>
  )
}
