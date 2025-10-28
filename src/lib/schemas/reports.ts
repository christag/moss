/**
 * Zod validation schemas for Custom Reports and Dashboards
 */
import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Object types available for reporting (all 16 core M.O.S.S. objects)
 */
export const ObjectTypeSchema = z.enum([
  'device',
  'person',
  'location',
  'room',
  'company',
  'network',
  'io',
  'ip_address',
  'software',
  'saas_service',
  'installed_application',
  'software_license',
  'document',
  'external_document',
  'contract',
  'group',
])

/**
 * Filter operators for report conditions
 */
export const FilterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'between',
  'in_list',
  'not_in_list',
  'is_null',
  'is_not_null',
])

/**
 * Logical operators for filter groups
 */
export const LogicalOperatorSchema = z.enum(['AND', 'OR'])

/**
 * Aggregation function types
 */
export const AggregationTypeSchema = z.enum(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'])

/**
 * Sort direction
 */
export const SortDirectionSchema = z.enum(['ASC', 'DESC'])

/**
 * Export format options
 */
export const ExportFormatSchema = z.enum(['csv', 'xlsx', 'pdf'])

// ============================================================================
// FILTER CONDITION SCHEMA (Recursive for nested groups)
// ============================================================================

export type FilterCondition = {
  type: 'condition' | 'group'
  field?: string
  operator?: z.infer<typeof FilterOperatorSchema>
  value?: string | number | boolean | string[]
  conditions?: FilterCondition[]
  logicalOperator?: z.infer<typeof LogicalOperatorSchema>
}

export const FilterConditionSchema: z.ZodType<FilterCondition> = z.lazy(() =>
  z.object({
    type: z.enum(['condition', 'group']),
    field: z.string().optional(),
    operator: FilterOperatorSchema.optional(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
    conditions: z.array(FilterConditionSchema).optional(),
    logicalOperator: LogicalOperatorSchema.optional(),
  })
)

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

/**
 * Aggregation configuration
 */
export const AggregationConfigSchema = z.object({
  type: AggregationTypeSchema,
  field: z.string(),
  alias: z.string().optional(),
})

/**
 * Sorting configuration
 */
export const SortConfigSchema = z.object({
  field: z.string(),
  direction: SortDirectionSchema,
})

/**
 * Base report schema (matches database table)
 */
export const CustomReportSchema = z.object({
  id: z.string().uuid().optional(),
  report_name: z.string().min(1, 'Report name is required').max(255),
  description: z.string().optional().nullable(),
  object_type: ObjectTypeSchema,
  fields: z.array(z.string()).min(1, 'At least one field is required'),
  filters: FilterConditionSchema.optional().nullable(),
  grouping: z.array(z.string()).optional().nullable(),
  aggregations: z.array(AggregationConfigSchema).optional().nullable(),
  sorting: z.array(SortConfigSchema).optional().nullable(),
  is_public: z.boolean().default(false),
  is_system: z.boolean().default(false),
  created_by: z.string().uuid().optional().nullable(),
  last_run_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

/**
 * Schema for creating a new report
 */
export const CreateCustomReportSchema = CustomReportSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_run_at: true,
})

/**
 * Schema for updating a report
 */
export const UpdateCustomReportSchema = CreateCustomReportSchema.partial()

/**
 * Schema for executing a report (with pagination)
 */
export const ExecuteReportSchema = z.object({
  reportConfig: CustomReportSchema.omit({
    id: true,
    created_by: true,
    created_at: true,
    updated_at: true,
    last_run_at: true,
  }),
  pagination: z
    .object({
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(1000).default(100),
    })
    .optional(),
})

/**
 * Schema for report export request
 */
export const ExportReportSchema = z.object({
  reportId: z.string().uuid(),
  format: ExportFormatSchema,
  metadata: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      generatedBy: z.string().optional(),
    })
    .optional(),
})

// ============================================================================
// DASHBOARD SCHEMAS
// ============================================================================

/**
 * Widget layout position (react-grid-layout format)
 */
export const WidgetLayoutSchema = z.object({
  i: z.string(), // Widget ID
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  minW: z.number().int().positive().optional(),
  minH: z.number().int().positive().optional(),
  maxW: z.number().int().positive().optional(),
  maxH: z.number().int().positive().optional(),
  static: z.boolean().optional(),
})

/**
 * Widget configuration (dynamic based on widget type)
 */
export const WidgetConfigSchema = z.object({
  id: z.string().uuid(),
  widget_type_id: z.string().uuid(),
  widget_name: z.string().min(1).max(100),
  configuration: z.record(z.unknown()), // Dynamic JSON configuration
})

/**
 * Base dashboard schema (matches database table)
 */
export const CustomDashboardSchema = z.object({
  id: z.string().uuid().optional(),
  dashboard_name: z.string().min(1, 'Dashboard name is required').max(255),
  description: z.string().optional().nullable(),
  layout: z.array(WidgetLayoutSchema),
  widgets: z.array(WidgetConfigSchema),
  created_by: z.string().uuid().optional().nullable(),
  is_default: z.boolean().default(false),
  is_public: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

/**
 * Schema for creating a new dashboard
 */
export const CreateCustomDashboardSchema = CustomDashboardSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

/**
 * Schema for updating a dashboard
 */
export const UpdateCustomDashboardSchema = CreateCustomDashboardSchema.partial()

// ============================================================================
// DASHBOARD WIDGET TYPE SCHEMA
// ============================================================================

/**
 * Widget type catalog schema (matches database table)
 */
export const DashboardWidgetTypeSchema = z.object({
  id: z.string().uuid().optional(),
  widget_name: z.string().min(1).max(100),
  widget_type: z.enum([
    'stat',
    'chart',
    'table',
    'list',
    'expiring',
    'network',
    'activity',
    'actions',
  ]),
  category: z.enum(['general', 'analytics', 'assets', 'network']).optional().nullable(),
  description: z.string().optional().nullable(),
  configuration_schema: z.record(z.unknown()),
  created_at: z.string().datetime().optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ObjectType = z.infer<typeof ObjectTypeSchema>
export type FilterOperator = z.infer<typeof FilterOperatorSchema>
export type LogicalOperator = z.infer<typeof LogicalOperatorSchema>
export type AggregationType = z.infer<typeof AggregationTypeSchema>
export type SortDirection = z.infer<typeof SortDirectionSchema>
export type ExportFormat = z.infer<typeof ExportFormatSchema>

export type AggregationConfig = z.infer<typeof AggregationConfigSchema>
export type SortConfig = z.infer<typeof SortConfigSchema>

export type CustomReport = z.infer<typeof CustomReportSchema>
export type CreateCustomReport = z.infer<typeof CreateCustomReportSchema>
export type UpdateCustomReport = z.infer<typeof UpdateCustomReportSchema>

export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>

export type CustomDashboard = z.infer<typeof CustomDashboardSchema>
export type CreateCustomDashboard = z.infer<typeof CreateCustomDashboardSchema>
export type UpdateCustomDashboard = z.infer<typeof UpdateCustomDashboardSchema>

export type DashboardWidgetType = z.infer<typeof DashboardWidgetTypeSchema>
