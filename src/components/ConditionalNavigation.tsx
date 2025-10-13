/**
 * Conditional Navigation Wrapper
 * Hides navigation for certain routes like /login and /setup
 */
'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './Navigation'

const ROUTES_WITHOUT_NAV = ['/login', '/setup']

export function ConditionalNavigation() {
  const pathname = usePathname()

  // Check if current path should show navigation
  const shouldShowNav = !ROUTES_WITHOUT_NAV.some((route) => pathname?.startsWith(route))

  if (!shouldShowNav) {
    return null
  }

  return <Navigation />
}
