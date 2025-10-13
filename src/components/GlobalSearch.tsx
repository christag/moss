/**
 * GlobalSearch Component
 * Multi-object search with keyboard shortcuts and real-time suggestions
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui'

interface SearchResult {
  id: string
  type: string
  name: string
  description?: string
  relevance: number
}

interface GroupedResults {
  [key: string]: SearchResult[]
}

const TYPE_LABELS: Record<string, string> = {
  device: 'Devices',
  person: 'People',
  location: 'Locations',
  network: 'Networks',
  software: 'Software',
  saas_service: 'SaaS Services',
  document: 'Documents',
  contract: 'Contracts',
}

const TYPE_ROUTES: Record<string, string> = {
  device: '/devices',
  person: '/people',
  location: '/locations',
  network: '/networks',
  software: '/software',
  saas_service: '/saas-services',
  document: '/documents',
  contract: '/contracts',
}

const TYPE_ICONS: Record<string, string> = {
  device: '💻',
  person: '👤',
  location: '📍',
  network: '🌐',
  software: '📦',
  saas_service: '☁️',
  document: '📄',
  contract: '📋',
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GroupedResults>({})
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowDropdown(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({})
      setShowDropdown(false)
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query])

  async function performSearch(searchQuery: string) {
    try {
      setLoading(true)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Search API error:', response.status, errorData)
        throw new Error(`Search failed: ${response.status}`)
      }
      const data = await response.json()
      setResults(data.results || {})
      setShowDropdown(true)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search error:', error)
      setResults({})
    } finally {
      setLoading(false)
    }
  }

  function getFlatResults(): Array<SearchResult & { type: string }> {
    const flat: Array<SearchResult & { type: string }> = []
    Object.entries(results).forEach(([type, items]) => {
      items.forEach((item) => flat.push({ ...item, type }))
    })
    return flat
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const flatResults = getFlatResults()

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % flatResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length)
    } else if (e.key === 'Enter' && flatResults.length > 0) {
      e.preventDefault()
      const selected = flatResults[selectedIndex]
      navigateToResult(selected.type, selected.id)
    }
  }

  function navigateToResult(type: string, id: string) {
    const route = TYPE_ROUTES[type]
    if (route) {
      router.push(`${route}/${id}`)
      setShowDropdown(false)
      setQuery('')
    }
  }

  const flatResults = getFlatResults()
  const hasResults = Object.keys(results).length > 0

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Global search"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={showDropdown}
          aria-activedescendant={
            flatResults.length > 0 ? `search-result-${flatResults[selectedIndex]?.id}` : undefined
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search... (press / to focus)"
          style={{
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            paddingLeft: 'var(--spacing-xl)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            if (query.trim().length >= 2) setShowDropdown(true)
            e.currentTarget.style.borderColor = 'var(--color-morning-blue)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 'var(--spacing-sm)',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon name="magnifying-glass-search" size={16} aria-label="Search" />
        </span>
        {loading && (
          <span
            style={{
              position: 'absolute',
              right: 'var(--spacing-sm)',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              color: 'var(--color-brew-black-60)',
            }}
          >
            Searching...
          </span>
        )}
      </div>

      {showDropdown && query.trim().length >= 2 && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          aria-label="Search results"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {!loading && !hasResults && (
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: 'var(--spacing-lg)',
                textAlign: 'center',
                color: 'var(--color-brew-black-60)',
              }}
            >
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!loading && hasResults && (
            <>
              {Object.entries(results).map(([type, items]) => (
                <div key={type}>
                  <div
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      backgroundColor: 'var(--color-off-white)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--color-brew-black-60)',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    {TYPE_ICONS[type]} {TYPE_LABELS[type]}
                  </div>
                  {items.map((item, _itemIndex) => {
                    const globalIndex = flatResults.findIndex(
                      (r) => r.id === item.id && r.type === type
                    )
                    const isSelected = globalIndex === selectedIndex

                    return (
                      <div
                        key={item.id}
                        id={`search-result-${item.id}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => navigateToResult(type, item.id)}
                        style={{
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-light-blue)' : 'white',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div style={{ fontWeight: '500', marginBottom: '2px' }}>{item.name}</div>
                        {item.description && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-brew-black-60)',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
