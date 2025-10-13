/**
 * Input Sanitization Utilities
 * Protects against XSS attacks by sanitizing user input
 *
 * SECURITY NOTE: This is a server-side sanitizer that removes dangerous HTML/JS
 * All user input should be sanitized before storing in the database
 */

/**
 * Dangerous patterns that should never be allowed in user input
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframes
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // Objects
  /<embed\b[^>]*>/gi, // Embeds
  /<link\b[^>]*>/gi, // Link tags (can load external CSS with JS)
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, // Style tags (can contain JS)
  /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers (onclick, onerror, etc.)
  /on\w+\s*=\s*[^\s>]*/gi, // Event handlers without quotes
  /javascript:/gi, // javascript: protocol
  /data:text\/html/gi, // data: URLs with HTML
  /vbscript:/gi, // VBScript protocol
  /<meta\b[^>]*>/gi, // Meta tags (can cause redirects)
  /<base\b[^>]*>/gi, // Base tags (can hijack links)
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, // Forms (can submit to attacker)
]

/**
 * Allowed HTML tags for rich text content
 * Only safe formatting tags are allowed
 */
const ALLOWED_HTML_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a', // Links are allowed but will be validated separately
]

/**
 * Sanitize a string value by removing dangerous HTML/JS
 * @param value - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  value: string,
  options: {
    allowHTML?: boolean
    allowLinks?: boolean
    maxLength?: number
  } = {}
): string {
  const { allowHTML = false, allowLinks = false, maxLength } = options

  if (typeof value !== 'string') {
    return ''
  }

  let sanitized = value

  // Trim whitespace
  sanitized = sanitized.trim()

  // Apply max length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // If HTML is not allowed, escape all HTML entities
  if (!allowHTML) {
    sanitized = escapeHTML(sanitized)
    return sanitized
  }

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Validate and sanitize links if present
  if (allowLinks) {
    sanitized = sanitizeLinks(sanitized)
  } else {
    // Remove all anchor tags
    sanitized = sanitized.replace(/<a\b[^<]*(?:(?!<\/a>)<[^<]*)*<\/a>/gi, '')
  }

  // Remove all HTML tags except allowed ones
  sanitized = sanitizeAllowedTags(sanitized)

  return sanitized
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHTML(value: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return value.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Sanitize links to only allow safe protocols
 */
function sanitizeLinks(value: string): string {
  // Match anchor tags and validate href
  return value.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (match, href, text) => {
    // Only allow http, https, and mailto protocols
    const safeProtocols = /^(https?:|mailto:)/i
    if (!safeProtocols.test(href)) {
      // Remove the link but keep the text
      return escapeHTML(text)
    }
    // Return sanitized link
    return `<a href="${escapeHTML(href)}" rel="noopener noreferrer" target="_blank">${escapeHTML(text)}</a>`
  })
}

/**
 * Remove HTML tags except allowed ones
 */
function sanitizeAllowedTags(value: string): string {
  // Remove all tags except allowed ones
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi

  return value.replace(tagPattern, (match, tagName) => {
    if (ALLOWED_HTML_TAGS.includes(tagName.toLowerCase())) {
      return match
    }
    return '' // Remove the tag
  })
}

/**
 * Sanitize an object recursively
 * Walks through all string properties and sanitizes them
 * @param obj - The object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    allowHTML?: boolean
    allowLinks?: boolean
    excludeFields?: string[]
  } = {}
): T {
  const { excludeFields = [] } = options

  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options)) as T
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    // Skip excluded fields
    if (excludeFields.includes(key)) {
      sanitized[key] = value
      continue
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, options)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Validate that a string does not contain XSS patterns
 * Returns true if safe, false if dangerous patterns detected
 * @param value - The string to validate
 * @returns Boolean indicating if value is safe
 */
export function isXSSSafe(value: string): boolean {
  if (typeof value !== 'string') {
    return true
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) {
      return false
    }
  }

  return true
}

/**
 * Get list of dangerous patterns found in a string
 * Useful for logging/debugging
 * @param value - The string to check
 * @returns Array of pattern names that matched
 */
export function detectXSSPatterns(value: string): string[] {
  if (typeof value !== 'string') {
    return []
  }

  const matches: string[] = []
  const patternNames = [
    'script tag',
    'iframe tag',
    'object tag',
    'embed tag',
    'link tag',
    'style tag',
    'event handler (quoted)',
    'event handler (unquoted)',
    'javascript: protocol',
    'data:text/html URL',
    'vbscript: protocol',
    'meta tag',
    'base tag',
    'form tag',
  ]

  DANGEROUS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(value)) {
      matches.push(patternNames[index])
    }
  })

  return matches
}

/**
 * Sanitization middleware for API routes
 * Automatically sanitizes request body before processing
 *
 * Usage:
 * const body = await request.json()
 * const sanitizedBody = sanitizeRequestBody(body)
 */
export function sanitizeRequestBody<T extends Record<string, unknown>>(
  body: T,
  options: {
    allowHTML?: boolean
    allowLinks?: boolean
    richTextFields?: string[]
  } = {}
): T {
  const {
    richTextFields = ['content', 'description', 'notes'],
    allowHTML = false,
    allowLinks = false,
  } = options

  // Sanitize with different rules for rich text fields
  const sanitized = sanitizeObject(body, {
    allowHTML: false,
    allowLinks: false,
    excludeFields: richTextFields,
  })

  // Sanitize rich text fields with HTML allowed
  for (const field of richTextFields) {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field], {
        allowHTML,
        allowLinks,
      })
    }
  }

  return sanitized
}

/**
 * Log XSS attempt for security monitoring
 */
export function logXSSAttempt(
  endpoint: string,
  field: string,
  value: string,
  patterns: string[]
): void {
  console.warn('[SECURITY] XSS attempt detected:', {
    timestamp: new Date().toISOString(),
    endpoint,
    field,
    patterns,
    valueSample: value.substring(0, 100),
  })
}
