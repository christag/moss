import React from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`form-select ${error ? 'select-error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-help` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="select-error-text">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-help`} className="select-helper-text">
            {helperText}
          </p>
        )}

        <style jsx>{`
          .form-select.select-error {
            border-color: var(--color-error-border);
            background-color: rgba(224, 45, 60, 0.03);
          }

          .form-select.select-error:focus {
            border-color: var(--color-error-border);
            box-shadow: 0 0 0 1px var(--color-error-border);
          }

          .select-error-text {
            margin-top: 6px;
            font-size: 0.875rem;
            color: var(--color-error-border);
          }

          .select-helper-text {
            margin-top: 6px;
            font-size: 0.875rem;
            color: var(--color-brew-black-60);
          }
        `}</style>
      </div>
    )
  }
)

Select.displayName = 'Select'
