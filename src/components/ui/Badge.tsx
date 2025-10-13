import React from 'react'

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'secondary'
  | 'default'
  | 'blue'
  | 'green'
  | 'orange'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'gray'

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
  // Design system colors: Morning Blue, Green, Orange, Tangerine, Light Blue
  const variantClasses = {
    // Semantic variants (using design system colors)
    success: 'badge-success', // Green (#28C077)
    warning: 'badge-warning', // Tangerine (#FFBB5C)
    error: 'badge-error', // Orange (#FD6A3D)
    info: 'badge-info', // Light Blue (#ACD7FF)
    secondary: 'bg-light-blue text-black', // Light Blue for secondary/inactive states
    default: 'bg-black bg-opacity-10 text-black',

    // Direct color variants (mapped to design system)
    blue: 'bg-blue text-off-white', // Morning Blue (#1C7FF2)
    green: 'bg-green text-off-white', // Green (#28C077)
    orange: 'bg-orange text-off-white', // Orange (#FD6A3D)
    yellow: 'bg-tangerine text-black', // Tangerine (#FFBB5C)
    red: 'bg-orange text-off-white', // Use Orange for red (no separate red in design system)
    purple: 'bg-blue text-off-white', // Use Morning Blue for purple
    gray: 'bg-black bg-opacity-20 text-black', // Black with opacity
  }

  const classes = ['badge', variantClasses[variant], className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'
