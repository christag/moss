import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  showValidState?: boolean // Show green checkmark when valid
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, showValidState = false, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const isValid = showValidState && !error && props.value && String(props.value).length > 0

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required && (
              <span className="text-orange ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <div className="input-wrapper">
          <input
            ref={ref}
            id={inputId}
            className={`form-input ${error ? 'input-error' : ''} ${isValid ? 'input-valid' : ''} ${className}`}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined
            }
            {...props}
          />
          {error && (
            <span className="input-icon input-icon-error" aria-hidden="true">
              ✕
            </span>
          )}
          {isValid && (
            <span className="input-icon input-icon-success" aria-hidden="true">
              ✓
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="input-error-text" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-help`} className="input-helper-text">
            {helperText}
          </p>
        )}

        <style jsx>{`
          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .input-icon {
            position: absolute;
            right: 0.75rem;
            font-size: 1.25rem;
            font-weight: bold;
            pointer-events: none;
          }

          .input-icon-error {
            color: var(--color-orange);
          }

          .input-icon-success {
            color: var(--color-green);
          }

          .form-input.input-error {
            border-color: var(--color-orange);
            background-color: rgba(253, 106, 61, 0.05);
          }

          .form-input.input-error:focus {
            outline: 2px solid var(--color-orange);
            outline-offset: 2px;
          }

          .form-input.input-valid {
            border-color: var(--color-green);
          }

          .form-input.input-valid:focus {
            outline: 2px solid var(--color-green);
            outline-offset: 2px;
          }

          .input-error-text {
            margin-top: 0.375rem;
            font-size: 0.875rem;
            color: var(--color-orange);
          }

          .input-helper-text {
            margin-top: 0.375rem;
            font-size: 0.875rem;
            color: var(--color-brew-black-60);
          }
        `}</style>
      </div>
    )
  }
)

Input.displayName = 'Input'
