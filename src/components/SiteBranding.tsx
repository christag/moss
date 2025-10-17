/**
 * Site Branding Component
 * Client component that fetches and displays site name and logo
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface BrandingData {
  site_name: string
  logo_url: string | null
}

export function SiteBranding() {
  const [branding, setBranding] = useState<BrandingData>({
    site_name: 'M.O.S.S.',
    logo_url: null,
  })

  useEffect(() => {
    // Fetch branding settings from API
    fetch('/api/admin/settings/branding')
      .then((res) => res.json())
      .then((data) => {
        if (data.site_name) {
          setBranding({
            site_name: data.site_name,
            logo_url: data.logo_url || null,
          })
        }
      })
      .catch((err) => {
        console.error('Failed to load branding:', err)
      })
  }, [])

  return (
    <>
      <Link
        href="/"
        aria-label={`${branding.site_name} Home`}
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: 'var(--color-black)',
          fontWeight: '700',
          fontSize: '1.5rem',
        }}
      >
        {branding.logo_url ? (
          // Display custom logo if provided
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logo_url}
            alt={branding.site_name}
            style={{
              height: '40px',
              width: 'auto',
              marginRight: 'var(--spacing-sm)',
            }}
          />
        ) : (
          // Display default icon
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--color-blue)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-off-white)',
              fontWeight: 'bold',
              marginRight: 'var(--spacing-sm)',
            }}
          >
            {branding.site_name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="site-title-text">{branding.site_name}</span>
      </Link>

      <style jsx>{`
        .site-title-text {
          display: inline;
        }

        /* Hide site title text on screens smaller than 768px (tablet/mobile) */
        @media (max-width: 768px) {
          .site-title-text {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
