import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    default: 'bg-black bg-opacity-10 text-black',
  }

  const classes = ['badge', variantClasses[variant], className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'
