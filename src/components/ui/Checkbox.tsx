import React from 'react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  helperText?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="checkbox-wrapper">
        <div className="checkbox-container">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={`checkbox-input ${error ? 'checkbox-error' : ''} ${className}`}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${checkboxId}-error` : helperText ? `${checkboxId}-help` : undefined
            }
            {...props}
          />
          <div className="checkbox-custom">
            <svg
              className="checkbox-icon"
              width="14"
              height="11"
              viewBox="0 0 14 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 5.5L5 9.5L13 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {label && (
            <label htmlFor={checkboxId} className="checkbox-label">
              {label}
              {props.required && (
                <span className="text-orange ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>
          )}
        </div>
        {helperText && !error && (
          <p id={`${checkboxId}-help`} className="checkbox-helper-text">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${checkboxId}-error`} className="checkbox-error-text" role="alert">
            {error}
          </p>
        )}

        <style jsx>{`
          .checkbox-wrapper {
            margin-bottom: var(--spacing-md);
          }

          .checkbox-container {
            display: flex;
            align-items: center;
            position: relative;
          }

          /* Hide native checkbox */
          .checkbox-input {
            position: absolute;
            opacity: 0;
            width: 19px;
            height: 19px;
            cursor: pointer;
            z-index: 2;
          }

          /* Custom checkbox styling */
          .checkbox-custom {
            position: relative;
            width: 19px;
            height: 19px;
            min-width: 19px;
            min-height: 19px;
            border: 1px solid var(--color-border-default);
            border-radius: 3.5px;
            background-color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            margin-right: 8px;
          }

          /* Checkmark icon (hidden by default) */
          .checkbox-icon {
            opacity: 0;
            color: white;
            transform: scale(0.8);
            transition: all 0.15s ease;
          }

          /* When checked */
          .checkbox-input:checked + .checkbox-custom {
            background-color: var(--color-black);
            border-color: var(--color-black);
          }

          .checkbox-input:checked + .checkbox-custom .checkbox-icon {
            opacity: 1;
            transform: scale(1);
          }

          /* Focus state */
          .checkbox-input:focus-visible + .checkbox-custom {
            outline: 2px solid var(--color-black);
            outline-offset: 2px;
          }

          /* Hover state */
          .checkbox-input:not(:disabled):hover + .checkbox-custom {
            border-color: var(--color-black);
          }

          /* Disabled state */
          .checkbox-input:disabled + .checkbox-custom {
            background-color: var(--color-disabled);
            border-color: var(--color-disabled);
            cursor: not-allowed;
            opacity: 0.6;
          }

          .checkbox-input:disabled:checked + .checkbox-custom {
            background-color: rgba(var(--color-black-rgb), 0.3);
          }

          .checkbox-input:disabled ~ .checkbox-label {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Error state */
          .checkbox-input.checkbox-error + .checkbox-custom {
            border-color: var(--color-error-border);
          }

          /* Label */
          .checkbox-label {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-normal);
            color: var(--color-black);
            cursor: pointer;
            user-select: none;
          }

          /* Helper and error text */
          .checkbox-helper-text {
            margin-top: 4px;
            margin-left: 27px;
            font-size: 0.875rem;
            color: var(--color-brew-black-60);
          }

          .checkbox-error-text {
            margin-top: 4px;
            margin-left: 27px;
            font-size: 0.875rem;
            color: var(--color-error-border);
          }
        `}</style>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
