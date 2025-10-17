import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  iconOnly?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      iconOnly = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn'
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      destructive: 'btn-destructive bg-orange text-off-white hover:opacity-90',
    }
    // Size classes - use minimal overrides since CSS handles standard sizing
    const sizeClasses = {
      sm: iconOnly ? 'text-sm px-sm py-xs h-auto' : 'text-sm px-lg py-xs h-auto',
      md: iconOnly ? '' : '', // Default size, handled by .btn class
      lg: iconOnly ? 'text-lg px-lg py-md h-auto' : 'text-lg px-xl py-md h-auto',
    }

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      isLoading || disabled ? 'opacity-50 cursor-not-allowed' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
        {isLoading && (
          <span className="btn-spinner" aria-hidden="true">
            ⟳
          </span>
        )}
        <span
          style={{
            opacity: isLoading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          {children}
        </span>

        <style jsx>{`
          .btn-spinner {
            display: inline-block;
            margin-right: 0.5rem;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </button>
    )
  }
)

Button.displayName = 'Button'
