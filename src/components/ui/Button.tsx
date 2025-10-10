import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
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
      destructive: 'bg-orange text-off-white hover:opacity-90',
    }
    const sizeClasses = {
      sm: 'text-sm p-xs pl-md pr-md',
      md: 'text-md p-sm pl-lg pr-lg',
      lg: 'text-lg p-md pl-xl pr-xl',
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
        {isLoading ? 'Loading...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
