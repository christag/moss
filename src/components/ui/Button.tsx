'use client'

import React from 'react'
import { motion } from 'framer-motion'

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
      <motion.div
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15 }}
        style={{ display: 'inline-block', width: fullWidth ? '100%' : 'auto' }}
      >
        <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
          {isLoading && (
            <motion.span
              className="btn-spinner"
              aria-hidden="true"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              ⟳
            </motion.span>
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
            }
          `}</style>
        </button>
      </motion.div>
    )
  }
)

Button.displayName = 'Button'
