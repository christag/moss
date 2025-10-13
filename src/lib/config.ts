/**
 * Configuration Loader for M.O.S.S.
 *
 * Loads configuration from two sources with priority:
 * 1. Environment variables (highest priority - for containerized deployments)
 * 2. Database system_settings table (fallback - for UI-configured settings)
 *
 * Environment variables follow the pattern: MOSS_<SETTING_KEY>
 * Example: branding.site_name → MOSS_SITE_NAME
 */

import { getPool } from './db'

// ============================================================================
// Type Definitions
// ============================================================================

export interface BrandingConfig {
  site_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  background_color: string
  text_color: string
  accent_color: string
}

export interface AuthConfig {
  backend: 'local' | 'ldap' | 'saml'
  mfa_required: boolean
  session_timeout: number
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_special: boolean
  saml: {
    enabled: boolean
    idp_entity_id: string | null
    idp_sso_url: string | null
    idp_certificate: string | null
  }
}

export interface StorageConfig {
  backend: 'local' | 'nfs' | 'smb' | 's3'
  local: {
    path: string
  }
  s3: {
    endpoint: string | null
    bucket: string | null
    region: string
    access_key: string | null
    secret_key: string | null
  }
  nfs: {
    server: string | null
    path: string | null
  }
  smb: {
    server: string | null
    share: string | null
    username: string | null
    password: string | null
  }
}

export interface NotificationConfig {
  smtp: {
    enabled: boolean
    host: string | null
    port: number
    username: string | null
    password: string | null
    from_address: string | null
    from_name: string
    use_tls: boolean
  }
}

export interface GeneralConfig {
  timezone: string
  date_format: string
  items_per_page: number
  max_file_size_mb: number
  allowed_mime_types: string
  backup: {
    enabled: boolean
    frequency: 'daily' | 'weekly'
    retention_days: number
  }
}

export interface AppConfig {
  branding: BrandingConfig
  auth: AuthConfig
  storage: StorageConfig
  notifications: NotificationConfig
  general: GeneralConfig
}

// ============================================================================
// Configuration Cache
// ============================================================================

let configCache: AppConfig | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minute

// ============================================================================
// Environment Variable Helpers
// ============================================================================

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

/**
 * Get boolean environment variable
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

/**
 * Get number environment variable
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

// ============================================================================
// Database Setting Helpers
// ============================================================================

/**
 * Load all system settings from database
 */
async function loadDatabaseSettings(): Promise<Record<string, unknown>> {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT key, value FROM system_settings')

    const settings: Record<string, unknown> = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }

    return settings
  } catch (error) {
    console.error('[Config] Failed to load database settings:', error)
    return {}
  }
}

/**
 * Get setting from database with fallback to default
 */
function getDbSetting<T>(settings: Record<string, unknown>, key: string, defaultValue: T): T {
  const value = settings[key]
  if (value === undefined || value === null) return defaultValue
  return value as T
}

// ============================================================================
// Configuration Builders
// ============================================================================

/**
 * Build branding configuration
 */
function buildBrandingConfig(dbSettings: Record<string, unknown>): BrandingConfig {
  return {
    site_name:
      getEnv('MOSS_SITE_NAME') || getDbSetting(dbSettings, 'branding.site_name', 'M.O.S.S.'),
    logo_url: getEnv('MOSS_LOGO_URL') || getDbSetting(dbSettings, 'branding.logo_url', null),
    favicon_url:
      getEnv('MOSS_FAVICON_URL') || getDbSetting(dbSettings, 'branding.favicon_url', null),
    primary_color:
      getEnv('MOSS_PRIMARY_COLOR') || getDbSetting(dbSettings, 'branding.primary_color', '#1C7FF2'),
    background_color:
      getEnv('MOSS_BACKGROUND_COLOR') ||
      getDbSetting(dbSettings, 'branding.background_color', '#FAF9F5'),
    text_color:
      getEnv('MOSS_TEXT_COLOR') || getDbSetting(dbSettings, 'branding.text_color', '#231F20'),
    accent_color:
      getEnv('MOSS_ACCENT_COLOR') || getDbSetting(dbSettings, 'branding.accent_color', '#28C077'),
  }
}

/**
 * Build authentication configuration
 */
function buildAuthConfig(dbSettings: Record<string, unknown>): AuthConfig {
  return {
    backend: (getEnv('MOSS_AUTH_BACKEND') || getDbSetting(dbSettings, 'auth.backend', 'local')) as
      | 'local'
      | 'ldap'
      | 'saml',
    mfa_required: getEnvBoolean(
      'MOSS_MFA_REQUIRED',
      getDbSetting(dbSettings, 'auth.mfa_required', false)
    ),
    session_timeout: getEnvNumber(
      'MOSS_SESSION_TIMEOUT',
      getDbSetting(dbSettings, 'auth.session_timeout', 2592000)
    ),
    password_min_length: getEnvNumber(
      'MOSS_PASSWORD_MIN_LENGTH',
      getDbSetting(dbSettings, 'auth.password_min_length', 8)
    ),
    password_require_uppercase: getEnvBoolean(
      'MOSS_PASSWORD_REQUIRE_UPPERCASE',
      getDbSetting(dbSettings, 'auth.password_require_uppercase', true)
    ),
    password_require_lowercase: getEnvBoolean(
      'MOSS_PASSWORD_REQUIRE_LOWERCASE',
      getDbSetting(dbSettings, 'auth.password_require_lowercase', true)
    ),
    password_require_numbers: getEnvBoolean(
      'MOSS_PASSWORD_REQUIRE_NUMBERS',
      getDbSetting(dbSettings, 'auth.password_require_numbers', true)
    ),
    password_require_special: getEnvBoolean(
      'MOSS_PASSWORD_REQUIRE_SPECIAL',
      getDbSetting(dbSettings, 'auth.password_require_special', false)
    ),
    saml: {
      enabled: getEnvBoolean(
        'MOSS_SAML_ENABLED',
        getDbSetting(dbSettings, 'auth.saml.enabled', false)
      ),
      idp_entity_id:
        getEnv('MOSS_SAML_IDP_ENTITY_ID') ||
        getDbSetting(dbSettings, 'auth.saml.idp_entity_id', null),
      idp_sso_url:
        getEnv('MOSS_SAML_IDP_SSO_URL') || getDbSetting(dbSettings, 'auth.saml.idp_sso_url', null),
      idp_certificate:
        getEnv('MOSS_SAML_IDP_CERTIFICATE') ||
        getDbSetting(dbSettings, 'auth.saml.idp_certificate', null),
    },
  }
}

/**
 * Build storage configuration
 */
function buildStorageConfig(dbSettings: Record<string, unknown>): StorageConfig {
  return {
    backend: (getEnv('MOSS_STORAGE_BACKEND') ||
      getDbSetting(dbSettings, 'storage.backend', 'local')) as 'local' | 'nfs' | 'smb' | 's3',
    local: {
      path:
        getEnv('MOSS_STORAGE_LOCAL_PATH') ||
        getDbSetting(dbSettings, 'storage.local.path', '/var/lib/moss/uploads'),
    },
    s3: {
      endpoint: getEnv('MOSS_S3_ENDPOINT') || getDbSetting(dbSettings, 'storage.s3.endpoint', null),
      bucket: getEnv('MOSS_S3_BUCKET') || getDbSetting(dbSettings, 'storage.s3.bucket', null),
      region:
        getEnv('MOSS_S3_REGION') || getDbSetting(dbSettings, 'storage.s3.region', 'us-east-1'),
      access_key:
        getEnv('MOSS_S3_ACCESS_KEY') || getDbSetting(dbSettings, 'storage.s3.access_key', null),
      secret_key:
        getEnv('MOSS_S3_SECRET_KEY') || getDbSetting(dbSettings, 'storage.s3.secret_key', null),
    },
    nfs: {
      server: getEnv('MOSS_NFS_SERVER') || getDbSetting(dbSettings, 'storage.nfs.server', null),
      path: getEnv('MOSS_NFS_PATH') || getDbSetting(dbSettings, 'storage.nfs.path', null),
    },
    smb: {
      server: getEnv('MOSS_SMB_SERVER') || getDbSetting(dbSettings, 'storage.smb.server', null),
      share: getEnv('MOSS_SMB_SHARE') || getDbSetting(dbSettings, 'storage.smb.share', null),
      username:
        getEnv('MOSS_SMB_USERNAME') || getDbSetting(dbSettings, 'storage.smb.username', null),
      password:
        getEnv('MOSS_SMB_PASSWORD') || getDbSetting(dbSettings, 'storage.smb.password', null),
    },
  }
}

/**
 * Build notification configuration
 */
function buildNotificationConfig(dbSettings: Record<string, unknown>): NotificationConfig {
  return {
    smtp: {
      enabled: getEnvBoolean(
        'MOSS_SMTP_ENABLED',
        getDbSetting(dbSettings, 'notifications.smtp.enabled', false)
      ),
      host: getEnv('MOSS_SMTP_HOST') || getDbSetting(dbSettings, 'notifications.smtp.host', null),
      port: getEnvNumber(
        'MOSS_SMTP_PORT',
        getDbSetting(dbSettings, 'notifications.smtp.port', 587)
      ),
      username:
        getEnv('MOSS_SMTP_USERNAME') ||
        getDbSetting(dbSettings, 'notifications.smtp.username', null),
      password:
        getEnv('MOSS_SMTP_PASSWORD') ||
        getDbSetting(dbSettings, 'notifications.smtp.password', null),
      from_address:
        getEnv('MOSS_SMTP_FROM_ADDRESS') ||
        getDbSetting(dbSettings, 'notifications.smtp.from_address', null),
      from_name:
        getEnv('MOSS_SMTP_FROM_NAME') ||
        getDbSetting(dbSettings, 'notifications.smtp.from_name', 'M.O.S.S.'),
      use_tls: getEnvBoolean(
        'MOSS_SMTP_USE_TLS',
        getDbSetting(dbSettings, 'notifications.smtp.use_tls', true)
      ),
    },
  }
}

/**
 * Build general configuration
 */
function buildGeneralConfig(dbSettings: Record<string, unknown>): GeneralConfig {
  return {
    timezone: getEnv('MOSS_TIMEZONE') || getDbSetting(dbSettings, 'general.timezone', 'UTC'),
    date_format:
      getEnv('MOSS_DATE_FORMAT') || getDbSetting(dbSettings, 'general.date_format', 'YYYY-MM-DD'),
    items_per_page: getEnvNumber(
      'MOSS_ITEMS_PER_PAGE',
      getDbSetting(dbSettings, 'general.items_per_page', 50)
    ),
    max_file_size_mb: getEnvNumber(
      'MOSS_MAX_FILE_SIZE_MB',
      getDbSetting(dbSettings, 'general.max_file_size_mb', 50)
    ),
    allowed_mime_types:
      getEnv('MOSS_ALLOWED_MIME_TYPES') ||
      getDbSetting(
        dbSettings,
        'general.allowed_mime_types',
        'image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*'
      ),
    backup: {
      enabled: getEnvBoolean(
        'MOSS_BACKUP_ENABLED',
        getDbSetting(dbSettings, 'general.backup.enabled', false)
      ),
      frequency: (getEnv('MOSS_BACKUP_FREQUENCY') ||
        getDbSetting(dbSettings, 'general.backup.frequency', 'daily')) as 'daily' | 'weekly',
      retention_days: getEnvNumber(
        'MOSS_BACKUP_RETENTION_DAYS',
        getDbSetting(dbSettings, 'general.backup.retention_days', 30)
      ),
    },
  }
}

// ============================================================================
// Main Configuration Loader
// ============================================================================

/**
 * Load complete application configuration
 * Uses caching to avoid repeated database queries
 */
export async function loadConfig(): Promise<AppConfig> {
  // Return cached config if still valid
  const now = Date.now()
  if (configCache && now - cacheTimestamp < CACHE_TTL) {
    return configCache
  }

  // Load settings from database
  const dbSettings = await loadDatabaseSettings()

  // Build configuration from env vars + database
  const config: AppConfig = {
    branding: buildBrandingConfig(dbSettings),
    auth: buildAuthConfig(dbSettings),
    storage: buildStorageConfig(dbSettings),
    notifications: buildNotificationConfig(dbSettings),
    general: buildGeneralConfig(dbSettings),
  }

  // Update cache
  configCache = config
  cacheTimestamp = now

  return config
}

/**
 * Invalidate configuration cache
 * Call this when settings are updated via admin panel
 */
export function invalidateConfigCache(): void {
  configCache = null
  cacheTimestamp = 0
}

/**
 * Get specific configuration section
 */
export async function getBrandingConfig(): Promise<BrandingConfig> {
  const config = await loadConfig()
  return config.branding
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const config = await loadConfig()
  return config.auth
}

export async function getStorageConfig(): Promise<StorageConfig> {
  const config = await loadConfig()
  return config.storage
}

export async function getNotificationConfig(): Promise<NotificationConfig> {
  const config = await loadConfig()
  return config.notifications
}

export async function getGeneralConfig(): Promise<GeneralConfig> {
  const config = await loadConfig()
  return config.general
}
