import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from '@/components/Providers'
import { ConditionalNavigation } from '@/components/ConditionalNavigation'
import { BrandingProvider } from '@/components/BrandingProvider'
import { getBrandingConfig } from '@/lib/config'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Generate dynamic metadata from branding settings
 */
export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBrandingConfig()

  return {
    title: `${branding.site_name} - IT Asset Management`,
    description: 'IT Asset Management Platform',
    icons: branding.favicon_url
      ? {
          icon: branding.favicon_url,
        }
      : undefined,
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <BrandingProvider>
          <Providers>
            <ConditionalNavigation />
            {children}
          </Providers>
        </BrandingProvider>
      </body>
    </html>
  )
}
