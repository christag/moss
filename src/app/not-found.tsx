// Minimal not-found page to avoid Next.js Html import error

export default function NotFound() {
  return (
    <html>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">Return Home</a>
      </body>
    </html>
  )
}
