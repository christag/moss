/**
 * BrandingProvider Component
 * Server component that loads branding settings from database
 * and injects dynamic CSS custom properties
 */

import { getBrandingConfig } from '@/lib/config'

export async function BrandingProvider({ children }: { children: React.ReactNode }) {
  // Load branding configuration from database
  const branding = await getBrandingConfig()

  return (
    <>
      {/* Inject dynamic CSS custom properties */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              /* Override design system colors with branding settings */
              --color-primary: ${branding.primary_color};
              --color-blue: ${branding.primary_color};
              --color-morning-blue: ${branding.primary_color};

              --color-background: ${branding.background_color};
              --color-off-white: ${branding.background_color};

              --color-text: ${branding.text_color};
              --color-black: ${branding.text_color};
              --color-brew-black: ${branding.text_color};

              --color-accent: ${branding.accent_color};
              --color-success: ${branding.accent_color};
            }
          `,
        }}
      />

      {/* Inject favicon if custom URL provided */}
      {branding.favicon_url && <link rel="icon" href={branding.favicon_url} type="image/x-icon" />}

      {children}
    </>
  )
}
