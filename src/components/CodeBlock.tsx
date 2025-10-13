/**
 * CodeBlock Component
 * Displays syntax-highlighted code with copy-to-clipboard functionality
 */
'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: 'json' | 'javascript' | 'bash' | 'typescript'
  title?: string
  showLineNumbers?: boolean
}

export function CodeBlock({
  code,
  language = 'json',
  title,
  showLineNumbers: _showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="code-block-container" style={{ marginBottom: 'var(--spacing-lg)' }}>
      {title && (
        <div
          className="code-block-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-black)',
            color: 'var(--color-off-white)',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          <span>{title}</span>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-off-white)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(250, 249, 245, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Copy code to clipboard"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      )}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#1e1e1e',
          borderRadius: title ? '0 0 4px 4px' : '4px',
          overflow: 'hidden',
        }}
      >
        {!title && (
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute',
              top: 'var(--spacing-sm)',
              right: 'var(--spacing-sm)',
              background: 'rgba(250, 249, 245, 0.1)',
              border: 'none',
              color: 'var(--color-off-white)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(250, 249, 245, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(250, 249, 245, 0.1)'
            }}
            aria-label="Copy code to clipboard"
          >
            {copied ? '✓' : '📋'}
          </button>
        )}
        <pre
          style={{
            margin: 0,
            padding: 'var(--spacing-md)',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
            color: '#d4d4d4',
          }}
        >
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  )
}
