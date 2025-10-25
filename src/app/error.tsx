'use client'

// Minimal error page to avoid Next.js Html import error

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h1>Error</h1>
        <p>Something went wrong: {error.message}</p>
        {error.digest && <p>Error ID: {error.digest}</p>}
        <button onClick={reset}>Try Again</button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">Return Home</a>
      </body>
    </html>
  )
}
