/**
 * API Documentation Metadata
 * Centralized definitions for all API endpoints in M.O.S.S.
 */

export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  authentication: 'required' | 'optional' | 'none'
  roleRequired?: 'user' | 'admin' | 'super_admin'
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponse[]
  examples: ApiExample[]
  relatedEndpoints?: string[]
}

export interface ApiParameter {
  name: string
  in: 'query' | 'path' | 'header'
  type: string
  required: boolean
  default?: string | number | boolean
  description: string
  validation?: string
  example?: string | number | boolean
}

export interface ApiRequestBody {
  contentType: string
  schema: object
  example: object
  description?: string
}

export interface ApiResponse {
  status: number
  description: string
  schema?: object
  example?: object
}

export interface ApiExample {
  title: string
  description?: string
  request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: object
  }
  response: {
    status: number
    body: object
  }
}

export interface ApiResource {
  name: string
  slug: string
  description: string
  icon?: string
  endpoints: ApiEndpoint[]
}

/**
 * API Resources - All documented endpoints organized by resource type
 */
export const API_RESOURCES: ApiResource[] = [
  {
    name: 'Companies',
    slug: 'companies',
    description:
      'Manage companies including vendors, manufacturers, service providers, and your own organization.',
    endpoints: [
      {
        path: '/api/companies',
        method: 'GET',
        description: 'List all companies with optional filtering, searching, and pagination.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search companies by name, website, email, or account number',
            example: 'Acme Corp',
          },
          {
            name: 'company_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by company type',
            validation:
              'own_organization | vendor | manufacturer | service_provider | partner | customer | other',
            example: 'vendor',
          },
          {
            name: 'city',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by city',
            example: 'New York',
          },
          {
            name: 'country',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by country',
            example: 'USA',
          },
          {
            name: 'page',
            in: 'query',
            type: 'number',
            required: false,
            default: 1,
            description: 'Page number for pagination',
            validation: 'Positive integer',
            example: 1,
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Number of results per page',
            validation: '1-100',
            example: 50,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'created_at',
            description: 'Field to sort by',
            validation: 'company_name | company_type | city | created_at | updated_at',
            example: 'company_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'desc',
            description: 'Sort order',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Successful response with companies list',
            example: {
              success: true,
              message: 'Companies retrieved successfully',
              data: {
                companies: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    company_name: 'Acme Corporation',
                    company_type: 'vendor',
                    website: 'https://acme.com',
                    email: 'contact@acme.com',
                    phone: '+1-555-0100',
                    city: 'New York',
                    state: 'NY',
                    country: 'USA',
                    created_at: '2025-01-15T10:00:00Z',
                    updated_at: '2025-01-15T10:00:00Z',
                  },
                ],
                pagination: {
                  page: 1,
                  limit: 50,
                  total: 1,
                  total_pages: 1,
                },
              },
            },
          },
          {
            status: 400,
            description: 'Invalid query parameters',
            example: {
              success: false,
              error: 'Invalid query parameters',
              details: {
                errors: [
                  {
                    path: ['limit'],
                    message: 'Number must be less than or equal to 100',
                  },
                ],
              },
            },
          },
          {
            status: 401,
            description: 'Unauthorized - authentication required',
            example: {
              success: false,
              error: 'Unauthorized',
            },
          },
        ],
        examples: [
          {
            title: 'Get all vendors',
            description: 'Retrieve all companies with type "vendor"',
            request: {
              method: 'GET',
              url: '/api/companies?company_type=vendor&sort_by=company_name&sort_order=asc',
              headers: {
                Authorization: 'Bearer YOUR_ACCESS_TOKEN',
              },
            },
            response: {
              status: 200,
              body: {
                success: true,
                data: {
                  companies: [],
                  pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
                },
              },
            },
          },
        ],
        relatedEndpoints: ['/api/companies/[id]', '/api/companies/bulk'],
      },
      {
        path: '/api/companies',
        method: 'POST',
        description: 'Create a new company.',
        authentication: 'none',
        roleRequired: 'user',
        requestBody: {
          contentType: 'application/json',
          description: 'Company data to create',
          schema: {
            type: 'object',
            required: ['company_name', 'company_type'],
            properties: {
              company_name: { type: 'string', maxLength: 255 },
              company_type: {
                type: 'string',
                enum: [
                  'own_organization',
                  'vendor',
                  'manufacturer',
                  'service_provider',
                  'partner',
                  'customer',
                  'other',
                ],
              },
              website: { type: 'string', format: 'url', nullable: true },
              phone: { type: 'string', maxLength: 50, nullable: true },
              email: { type: 'string', format: 'email', nullable: true },
              address: { type: 'string', nullable: true },
              city: { type: 'string', maxLength: 100, nullable: true },
              state: { type: 'string', maxLength: 100, nullable: true },
              zip: { type: 'string', maxLength: 20, nullable: true },
              country: { type: 'string', maxLength: 100, nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            company_name: 'Acme Corporation',
            company_type: 'vendor',
            website: 'https://acme.com',
            email: 'contact@acme.com',
            phone: '+1-555-0100',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA',
          },
        },
        responses: [
          {
            status: 201,
            description: 'Company created successfully',
            example: {
              success: true,
              message: 'Company created successfully',
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                company_name: 'Acme Corporation',
                company_type: 'vendor',
                created_at: '2025-01-15T10:00:00Z',
              },
            },
          },
          {
            status: 400,
            description: 'Validation error',
            example: {
              success: false,
              error: 'Validation failed',
              details: {
                errors: [
                  {
                    path: ['company_name'],
                    message: 'Required',
                  },
                ],
              },
            },
          },
        ],
        examples: [
          {
            title: 'Create a new vendor',
            request: {
              method: 'POST',
              url: '/api/companies',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer YOUR_ACCESS_TOKEN',
              },
              body: {
                company_name: 'Tech Supplies Inc',
                company_type: 'vendor',
                email: 'sales@techsupplies.com',
                phone: '+1-555-0200',
              },
            },
            response: {
              status: 201,
              body: {
                success: true,
                message: 'Company created successfully',
                data: { id: '123e4567-e89b-12d3-a456-426614174000' },
              },
            },
          },
        ],
      },
      {
        path: '/api/companies/[id]',
        method: 'GET',
        description: 'Get a specific company by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Company UUID',
            validation: 'Valid UUID',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Company found',
          },
          {
            status: 404,
            description: 'Company not found',
          },
        ],
        examples: [],
      },
      {
        path: '/api/companies/[id]',
        method: 'PUT',
        description: 'Update an existing company.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Company UUID',
            validation: 'Valid UUID',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Company updated successfully',
          },
        ],
        examples: [],
      },
      {
        path: '/api/companies/[id]',
        method: 'DELETE',
        description: 'Delete a company.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Company UUID',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Company deleted successfully',
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Devices',
    slug: 'devices',
    description:
      'Manage hardware devices including computers, servers, network equipment, and broadcast gear.',
    endpoints: [
      {
        path: '/api/devices',
        method: 'GET',
        description: 'List all devices with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by hostname, serial number, model, or asset tag',
            example: 'MBP-2021',
          },
          {
            name: 'device_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by device type',
            validation:
              'computer | server | switch | router | firewall | printer | mobile | iot | appliance | av_equipment | broadcast_equipment | patch_panel | ups | pdu | chassis | module | blade',
          },
          {
            name: 'status',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by status',
            validation: 'active | retired | repair | storage',
          },
          {
            name: 'location_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by location UUID',
          },
          {
            name: 'room_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by room UUID',
          },
          {
            name: 'assigned_to_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by assigned person UUID',
          },
          {
            name: 'manufacturer',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by manufacturer name (partial match)',
          },
          {
            name: 'page',
            in: 'query',
            type: 'number',
            required: false,
            default: 1,
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Items per page (1-100)',
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'created_at',
            description: 'Sort field',
            validation:
              'hostname | device_type | manufacturer | model | serial_number | asset_tag | status | purchase_date | warranty_expiration | created_at | updated_at',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'desc',
            description: 'Sort direction',
            validation: 'asc | desc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Devices list with pagination',
          },
        ],
        examples: [
          {
            title: 'Get active computers at a location',
            request: {
              method: 'GET',
              url: '/api/devices?device_type=computer&status=active&location_id=123e4567-e89b-12d3-a456-426614174000',
              headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { devices: [], pagination: {} } },
            },
          },
        ],
      },
      {
        path: '/api/devices',
        method: 'POST',
        description: 'Create a new device.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          schema: {
            type: 'object',
            required: ['device_type'],
            properties: {
              device_type: {
                type: 'string',
                enum: [
                  'computer',
                  'server',
                  'switch',
                  'router',
                  'firewall',
                  'printer',
                  'mobile',
                  'iot',
                  'appliance',
                  'av_equipment',
                  'broadcast_equipment',
                  'patch_panel',
                  'ups',
                  'pdu',
                  'chassis',
                  'module',
                  'blade',
                ],
              },
              hostname: { type: 'string', maxLength: 255, nullable: true },
              serial_number: { type: 'string', maxLength: 255, nullable: true },
              model: { type: 'string', maxLength: 255, nullable: true },
              manufacturer: { type: 'string', maxLength: 255, nullable: true },
              status: {
                type: 'string',
                enum: ['active', 'retired', 'repair', 'storage'],
                default: 'active',
              },
              location_id: { type: 'string', format: 'uuid', nullable: true },
              room_id: { type: 'string', format: 'uuid', nullable: true },
              assigned_to_id: { type: 'string', format: 'uuid', nullable: true },
            },
          },
          example: {
            device_type: 'computer',
            hostname: 'MBP-2021-001',
            manufacturer: 'Apple',
            model: 'MacBook Pro 16"',
            serial_number: 'C02ABC123DEF',
            status: 'active',
          },
        },
        responses: [
          {
            status: 201,
            description: 'Device created successfully',
          },
        ],
        examples: [],
      },
      {
        path: '/api/devices/[id]/duplicates',
        method: 'GET',
        description:
          'Find potential duplicate devices for a specific device based on serial number, asset tag, MAC address, hostname, and model matching with confidence scoring.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Device UUID',
            validation: 'Valid UUID',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'List of potential duplicates with confidence scores',
            example: {
              success: true,
              message: 'Duplicate search completed',
              data: {
                device_id: '123e4567-e89b-12d3-a456-426614174000',
                has_matches: true,
                match_count: 2,
                highest_confidence: 100,
                matches: [
                  {
                    device_id: '456e7890-e89b-12d3-a456-426614174001',
                    hostname: 'prod-switch-01',
                    manufacturer: 'Cisco',
                    model: 'Catalyst 2960',
                    serial_number: 'ABC123',
                    asset_tag: null,
                    confidence: 100,
                    confidence_level: 'definite',
                    matching_fields: ['serial_number'],
                    match_reason: 'Serial number matches: ABC123',
                  },
                ],
              },
            },
          },
          {
            status: 404,
            description: 'Device not found',
          },
        ],
        examples: [
          {
            title: 'Find duplicates by serial number',
            description:
              'Definite match (100% confidence) - two devices with identical serial numbers',
            request: {
              method: 'GET',
              url: '/api/devices/123e4567-e89b-12d3-a456-426614174000/duplicates',
              headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
            },
            response: {
              status: 200,
              body: {
                success: true,
                data: {
                  has_matches: true,
                  match_count: 1,
                  highest_confidence: 100,
                  matches: [
                    {
                      device_id: '456e7890-e89b-12d3-a456-426614174001',
                      hostname: 'MBP-2024-002',
                      serial_number: 'C02XG0FDH7JY',
                      confidence: 100,
                      confidence_level: 'definite',
                      matching_fields: ['serial_number'],
                      match_reason: 'Serial number matches: C02XG0FDH7JY',
                    },
                  ],
                },
              },
            },
          },
        ],
        relatedEndpoints: ['/api/devices/duplicates'],
      },
      {
        path: '/api/devices/duplicates',
        method: 'GET',
        description:
          'List all devices in the system that have potential duplicates (confidence ≥60%). Useful for data cleanup after imports or integrations.',
        authentication: 'none',
        responses: [
          {
            status: 200,
            description: 'List of devices with potential duplicates',
            example: {
              success: true,
              message: 'Found 5 devices with potential duplicates',
              data: {
                total_count: 5,
                devices: [
                  {
                    device_id: '123e4567-e89b-12d3-a456-426614174000',
                    hostname: 'prod-switch-01',
                    match_count: 2,
                    highest_confidence: 100,
                  },
                  {
                    device_id: '456e7890-e89b-12d3-a456-426614174001',
                    hostname: 'backup-switch-01',
                    match_count: 1,
                    highest_confidence: 75,
                  },
                ],
              },
            },
          },
        ],
        examples: [
          {
            title: 'Get all devices with duplicates',
            description: 'Returns devices with medium to definite confidence matches (≥60%)',
            request: {
              method: 'GET',
              url: '/api/devices/duplicates',
              headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
            },
            response: {
              status: 200,
              body: {
                success: true,
                data: {
                  total_count: 3,
                  devices: [
                    {
                      device_id: '123e4567-e89b-12d3-a456-426614174000',
                      hostname: 'server-01',
                      match_count: 1,
                      highest_confidence: 100,
                    },
                  ],
                },
              },
            },
          },
        ],
        relatedEndpoints: ['/api/devices/[id]/duplicates'],
      },
    ],
  },
  {
    name: 'People',
    slug: 'people',
    description: 'Manage people including employees, contractors, and vendor contacts.',
    endpoints: [
      {
        path: '/api/people',
        method: 'GET',
        description: 'List all people with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by full name, email, or employee ID',
            example: 'John Doe',
          },
          {
            name: 'person_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by person type',
            validation: 'employee | contractor | vendor_contact | partner | customer | other',
            example: 'employee',
          },
          {
            name: 'status',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by status',
            validation: 'active | inactive | terminated',
            example: 'active',
          },
          {
            name: 'company_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by company UUID',
          },
          {
            name: 'location_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by location UUID',
          },
          {
            name: 'department',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by department name',
            example: 'Engineering',
          },
          {
            name: 'manager_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by manager UUID (to find direct reports)',
          },
          {
            name: 'page',
            in: 'query',
            type: 'number',
            required: false,
            default: 1,
            description: 'Page number',
            example: 1,
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Items per page (1-200)',
            validation: '1-200',
            example: 50,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'full_name',
            description: 'Sort field',
            validation:
              'full_name | email | person_type | department | job_title | status | created_at | updated_at',
            example: 'full_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'asc',
            description: 'Sort direction',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'People list with pagination',
            example: {
              success: true,
              message: 'People retrieved successfully',
              data: {
                people: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    full_name: 'John Doe',
                    email: 'john.doe@example.com',
                    person_type: 'employee',
                    job_title: 'Senior Engineer',
                    department: 'Engineering',
                    status: 'active',
                  },
                ],
                pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
              },
            },
          },
        ],
        examples: [
          {
            title: 'Get active employees in Engineering',
            request: {
              method: 'GET',
              url: '/api/people?person_type=employee&status=active&department=Engineering',
              headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { people: [], pagination: {} } },
            },
          },
        ],
      },
      {
        path: '/api/people',
        method: 'POST',
        description: 'Create a new person.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          schema: {
            type: 'object',
            required: ['full_name', 'person_type'],
            properties: {
              full_name: { type: 'string', maxLength: 255 },
              email: { type: 'string', format: 'email', maxLength: 255, nullable: true },
              username: { type: 'string', maxLength: 100, nullable: true },
              phone: { type: 'string', maxLength: 50, nullable: true },
              mobile: { type: 'string', maxLength: 50, nullable: true },
              person_type: {
                type: 'string',
                enum: ['employee', 'contractor', 'vendor_contact', 'partner', 'customer', 'other'],
              },
              company_id: { type: 'string', format: 'uuid', nullable: true },
              employee_id: { type: 'string', maxLength: 100, nullable: true },
              job_title: { type: 'string', maxLength: 255, nullable: true },
              department: { type: 'string', maxLength: 255, nullable: true },
              location_id: { type: 'string', format: 'uuid', nullable: true },
              manager_id: { type: 'string', format: 'uuid', nullable: true },
              start_date: { type: 'string', format: 'date', nullable: true },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'terminated'],
                default: 'active',
              },
              preferred_contact_method: { type: 'string', maxLength: 50, nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            full_name: 'Jane Smith',
            email: 'jane.smith@example.com',
            person_type: 'employee',
            job_title: 'Software Engineer',
            department: 'Engineering',
            status: 'active',
          },
        },
        responses: [
          {
            status: 201,
            description: 'Person created successfully',
            example: {
              success: true,
              message: 'Person created successfully',
              data: { id: '123e4567-e89b-12d3-a456-426614174000' },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/people/[id]',
        method: 'GET',
        description: 'Get a specific person by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Person UUID',
            validation: 'Valid UUID',
          },
        ],
        responses: [
          { status: 200, description: 'Person found' },
          { status: 404, description: 'Person not found' },
        ],
        examples: [],
      },
      {
        path: '/api/people/[id]',
        method: 'PUT',
        description: 'Update an existing person.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Person UUID',
          },
        ],
        responses: [{ status: 200, description: 'Person updated successfully' }],
        examples: [],
      },
      {
        path: '/api/people/[id]',
        method: 'DELETE',
        description: 'Delete a person.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Person UUID',
          },
        ],
        responses: [{ status: 200, description: 'Person deleted successfully' }],
        examples: [],
      },
    ],
  },
  {
    name: 'Locations',
    slug: 'locations',
    description: 'Manage physical locations and sites.',
    endpoints: [
      {
        path: '/api/locations',
        method: 'GET',
        description: 'List all locations with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by location name, address, or city',
            example: 'New York Office',
          },
          {
            name: 'location_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by location type',
            validation:
              'office | datacenter | colo | remote | warehouse | studio | broadcast_facility',
            example: 'office',
          },
          {
            name: 'company_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by company UUID',
          },
          {
            name: 'city',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by city name',
            example: 'San Francisco',
          },
          {
            name: 'state',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by state',
            example: 'CA',
          },
          {
            name: 'country',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by country',
            example: 'USA',
          },
          {
            name: 'page',
            in: 'query',
            type: 'number',
            required: false,
            default: 1,
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Items per page (1-100)',
            validation: '1-100',
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'location_name',
            description: 'Sort field',
            validation:
              'location_name | city | state | country | location_type | created_at | updated_at',
            example: 'location_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'asc',
            description: 'Sort direction',
            validation: 'asc | desc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Locations list with pagination',
            example: {
              success: true,
              message: 'Locations retrieved successfully',
              data: {
                locations: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    location_name: 'Main Office',
                    city: 'New York',
                    state: 'NY',
                    country: 'USA',
                    location_type: 'office',
                  },
                ],
                pagination: { page: 1, limit: 50, total: 1, total_pages: 1 },
              },
            },
          },
        ],
        examples: [
          {
            title: 'Get all datacenters',
            request: {
              method: 'GET',
              url: '/api/locations?location_type=datacenter&sort_by=location_name',
              headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { locations: [], pagination: {} } },
            },
          },
        ],
      },
      {
        path: '/api/locations',
        method: 'POST',
        description: 'Create a new location.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          schema: {
            type: 'object',
            required: ['location_name'],
            properties: {
              location_name: { type: 'string', maxLength: 255 },
              company_id: { type: 'string', format: 'uuid', nullable: true },
              address: { type: 'string', nullable: true },
              city: { type: 'string', maxLength: 100, nullable: true },
              state: { type: 'string', maxLength: 100, nullable: true },
              zip: { type: 'string', maxLength: 20, nullable: true },
              country: { type: 'string', maxLength: 100, nullable: true },
              location_type: {
                type: 'string',
                enum: [
                  'office',
                  'datacenter',
                  'colo',
                  'remote',
                  'warehouse',
                  'studio',
                  'broadcast_facility',
                ],
                nullable: true,
              },
              timezone: { type: 'string', maxLength: 50, nullable: true },
              contact_phone: { type: 'string', maxLength: 50, nullable: true },
              access_instructions: { type: 'string', nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            location_name: 'San Francisco Office',
            address: '123 Market St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            country: 'USA',
            location_type: 'office',
            timezone: 'America/Los_Angeles',
          },
        },
        responses: [
          {
            status: 201,
            description: 'Location created successfully',
            example: {
              success: true,
              message: 'Location created successfully',
              data: { id: '123e4567-e89b-12d3-a456-426614174000' },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/locations/[id]',
        method: 'GET',
        description: 'Get a specific location by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Location UUID',
            validation: 'Valid UUID',
          },
        ],
        responses: [
          { status: 200, description: 'Location found' },
          { status: 404, description: 'Location not found' },
        ],
        examples: [],
      },
      {
        path: '/api/locations/[id]',
        method: 'PUT',
        description: 'Update an existing location.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Location UUID',
          },
        ],
        responses: [{ status: 200, description: 'Location updated successfully' }],
        examples: [],
      },
      {
        path: '/api/locations/[id]',
        method: 'DELETE',
        description: 'Delete a location.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Location UUID',
          },
        ],
        responses: [{ status: 200, description: 'Location deleted successfully' }],
        examples: [],
      },
    ],
  },
  {
    name: 'Networks',
    slug: 'networks',
    description: 'Manage networks, VLANs, and subnets.',
    endpoints: [
      {
        path: '/api/networks',
        method: 'GET',
        description: 'List all networks with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by network name or network address',
            example: 'Production',
          },
          {
            name: 'network_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by network type',
            validation: 'lan | wan | dmz | guest | management | storage | production | broadcast',
            example: 'production',
          },
          {
            name: 'location_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by location UUID',
          },
          {
            name: 'dhcp_enabled',
            in: 'query',
            type: 'boolean',
            required: false,
            description: 'Filter by DHCP enabled status',
            example: true,
          },
          {
            name: 'page',
            in: 'query',
            type: 'number',
            required: false,
            default: 1,
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Items per page (1-100)',
            validation: '1-100',
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'created_at',
            description: 'Sort field',
            validation:
              'network_name | network_address | vlan_id | network_type | created_at | updated_at',
            example: 'network_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'desc',
            description: 'Sort direction',
            validation: 'asc | desc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Networks list with pagination',
            example: {
              success: true,
              message: 'Networks retrieved successfully',
              data: {
                networks: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    network_name: 'Production Network',
                    network_address: '10.0.0.0/24',
                    vlan_id: 100,
                    network_type: 'production',
                    dhcp_enabled: true,
                  },
                ],
                pagination: { page: 1, limit: 50, total: 1, total_pages: 1 },
              },
            },
          },
        ],
        examples: [
          {
            title: 'Get production networks with DHCP',
            request: {
              method: 'GET',
              url: '/api/networks?network_type=production&dhcp_enabled=true',
              headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { networks: [], pagination: {} } },
            },
          },
        ],
      },
      {
        path: '/api/networks',
        method: 'POST',
        description: 'Create a new network.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          schema: {
            type: 'object',
            required: ['network_name'],
            properties: {
              location_id: { type: 'string', format: 'uuid', nullable: true },
              network_name: { type: 'string', maxLength: 255 },
              network_address: { type: 'string', maxLength: 50, nullable: true },
              vlan_id: { type: 'number', minimum: 1, maximum: 4094, nullable: true },
              network_type: {
                type: 'string',
                enum: [
                  'lan',
                  'wan',
                  'dmz',
                  'guest',
                  'management',
                  'storage',
                  'production',
                  'broadcast',
                ],
                nullable: true,
              },
              gateway: { type: 'string', maxLength: 50, nullable: true },
              dns_servers: { type: 'string', nullable: true },
              dhcp_enabled: { type: 'boolean', default: false },
              dhcp_range_start: { type: 'string', maxLength: 50, nullable: true },
              dhcp_range_end: { type: 'string', maxLength: 50, nullable: true },
              description: { type: 'string', nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            network_name: 'Production VLAN',
            network_address: '10.0.100.0/24',
            vlan_id: 100,
            network_type: 'production',
            gateway: '10.0.100.1',
            dhcp_enabled: true,
            dhcp_range_start: '10.0.100.10',
            dhcp_range_end: '10.0.100.250',
          },
        },
        responses: [
          {
            status: 201,
            description: 'Network created successfully',
            example: {
              success: true,
              message: 'Network created successfully',
              data: { id: '123e4567-e89b-12d3-a456-426614174000' },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/networks/[id]',
        method: 'GET',
        description: 'Get a specific network by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Network UUID',
            validation: 'Valid UUID',
          },
        ],
        responses: [
          { status: 200, description: 'Network found' },
          { status: 404, description: 'Network not found' },
        ],
        examples: [],
      },
      {
        path: '/api/networks/[id]',
        method: 'PUT',
        description: 'Update an existing network.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Network UUID',
          },
        ],
        responses: [{ status: 200, description: 'Network updated successfully' }],
        examples: [],
      },
      {
        path: '/api/networks/[id]',
        method: 'DELETE',
        description: 'Delete a network.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Network UUID',
          },
        ],
        responses: [{ status: 200, description: 'Network deleted successfully' }],
        examples: [],
      },
    ],
  },
  {
    name: 'Search',
    slug: 'search',
    description: 'Global search across all object types.',
    endpoints: [
      {
        path: '/api/search',
        method: 'GET',
        description:
          'Search across devices, people, locations, networks, software, SaaS services, documents, and contracts.',
        authentication: 'none',
        parameters: [
          {
            name: 'q',
            in: 'query',
            type: 'string',
            required: true,
            description: 'Search query (minimum 2 characters)',
            example: 'macbook',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 5,
            description: 'Maximum results per object type',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Search results grouped by object type',
            example: {
              query: 'macbook',
              results: {
                device: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    type: 'device',
                    name: 'MBP-2021-001',
                    description: 'Apple MacBook Pro 16"',
                    relevance: 0.95,
                  },
                ],
              },
              total: 1,
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Rooms',
    slug: 'rooms',
    description:
      'Manage rooms within locations including offices, server rooms, conference rooms, studios, and control rooms.',
    endpoints: [
      {
        path: '/api/rooms',
        method: 'GET',
        description: 'List all rooms with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search rooms by name or number',
            example: 'Server Room A',
          },
          {
            name: 'location_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by location UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          {
            name: 'room_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by room type',
            validation:
              'office | conference_room | server_room | closet | studio | control_room | edit_bay | storage | other',
            example: 'server_room',
          },
          {
            name: 'floor',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by floor',
            example: '2',
          },
          {
            name: 'page',
            in: 'query',
            type: 'number',
            required: false,
            default: 1,
            description: 'Page number for pagination',
            example: 1,
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Number of results per page (max 200)',
            validation: '1-200',
            example: 50,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'created_at',
            description: 'Sort by field',
            validation: 'room_name | room_type | floor | capacity | created_at | updated_at',
            example: 'room_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'asc',
            description: 'Sort order',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Rooms list with pagination',
            example: {
              success: true,
              data: {
                rooms: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    location_id: '123e4567-e89b-12d3-a456-426614174000',
                    room_name: 'Server Room A',
                    room_number: 'SR-201',
                    room_type: 'server_room',
                    floor: '2',
                    capacity: null,
                    access_requirements: 'Badge access required',
                    notes: 'Primary datacenter',
                    created_at: '2025-01-15T10:30:00Z',
                    updated_at: '2025-01-15T10:30:00Z',
                  },
                ],
                total: 25,
                page: 1,
                limit: 50,
              },
            },
          },
        ],
        examples: [
          {
            title: 'List all server rooms',
            request: {
              method: 'GET',
              url: '/api/rooms?room_type=server_room',
              headers: { Authorization: 'Bearer YOUR_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { rooms: [], total: 0 } },
            },
          },
        ],
      },
      {
        path: '/api/rooms',
        method: 'POST',
        description: 'Create a new room.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          description: 'Room creation data',
          schema: {
            type: 'object',
            required: ['location_id', 'room_name'],
            properties: {
              location_id: { type: 'string', format: 'uuid', description: 'Parent location UUID' },
              room_name: { type: 'string', maxLength: 255, description: 'Room name' },
              room_number: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Room number identifier',
              },
              room_type: {
                type: 'string',
                enum: [
                  'office',
                  'conference_room',
                  'server_room',
                  'closet',
                  'studio',
                  'control_room',
                  'edit_bay',
                  'storage',
                  'other',
                ],
                nullable: true,
                description: 'Type of room',
              },
              floor: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Floor location',
              },
              capacity: {
                type: 'integer',
                minimum: 0,
                nullable: true,
                description: 'Room capacity (people)',
              },
              access_requirements: {
                type: 'string',
                nullable: true,
                description: 'Access requirements',
              },
              notes: { type: 'string', nullable: true, description: 'Additional notes' },
            },
          },
          example: {
            location_id: '123e4567-e89b-12d3-a456-426614174000',
            room_name: 'Control Room B',
            room_number: 'CR-305',
            room_type: 'control_room',
            floor: '3',
            capacity: 8,
            access_requirements: 'Production staff only',
            notes: 'Primary broadcast control',
          },
        },
        responses: [
          {
            status: 201,
            description: 'Room created successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                location_id: '123e4567-e89b-12d3-a456-426614174000',
                room_name: 'Control Room B',
                room_number: 'CR-305',
                room_type: 'control_room',
                floor: '3',
                capacity: 8,
                access_requirements: 'Production staff only',
                notes: 'Primary broadcast control',
                created_at: '2025-01-15T10:30:00Z',
                updated_at: '2025-01-15T10:30:00Z',
              },
              message: 'Room created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/rooms/[id]',
        method: 'GET',
        description: 'Retrieve a specific room by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Room UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174001',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Room details',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                location_id: '123e4567-e89b-12d3-a456-426614174000',
                room_name: 'Server Room A',
                room_number: 'SR-201',
                room_type: 'server_room',
                floor: '2',
                capacity: null,
                access_requirements: 'Badge access required',
                notes: 'Primary datacenter',
                created_at: '2025-01-15T10:30:00Z',
                updated_at: '2025-01-15T10:30:00Z',
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/rooms/[id]',
        method: 'PUT',
        description: 'Update an existing room.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Room UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174001',
          },
        ],
        requestBody: {
          contentType: 'application/json',
          description: 'Fields to update (all optional)',
          schema: {
            type: 'object',
            properties: {
              location_id: { type: 'string', format: 'uuid' },
              room_name: { type: 'string', maxLength: 255 },
              room_number: { type: 'string', maxLength: 50, nullable: true },
              room_type: {
                type: 'string',
                enum: [
                  'office',
                  'conference_room',
                  'server_room',
                  'closet',
                  'studio',
                  'control_room',
                  'edit_bay',
                  'storage',
                  'other',
                ],
                nullable: true,
              },
              floor: { type: 'string', maxLength: 50, nullable: true },
              capacity: { type: 'integer', minimum: 0, nullable: true },
              access_requirements: { type: 'string', nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            capacity: 12,
            notes: 'Expanded capacity',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Room updated successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                room_name: 'Server Room A',
                capacity: 12,
                notes: 'Expanded capacity',
                updated_at: '2025-01-15T11:00:00Z',
              },
              message: 'Room updated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/rooms/[id]',
        method: 'DELETE',
        description: 'Delete a room. Requires admin role.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Room UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174001',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Room deleted successfully',
            example: {
              success: true,
              message: 'Room deleted successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'IOs (Interfaces/Ports)',
    slug: 'ios',
    description:
      'Manage network interfaces, broadcast ports, power connections, and all other connectivity types. IOs are the universal connection object supporting ethernet, fiber, SDI, HDMI, power, and more.',
    endpoints: [
      {
        path: '/api/ios',
        method: 'GET',
        description: 'List all interfaces/ports with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by interface name, MAC address, or description',
            example: 'eth0',
          },
          {
            name: 'interface_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by interface type',
            validation:
              'ethernet | wifi | virtual | fiber_optic | sdi | hdmi | xlr | usb | thunderbolt | displayport | coax | serial | patch_panel_port | power_input | power_output | other',
            example: 'ethernet',
          },
          {
            name: 'media_type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by media/cable type',
            validation:
              'single_mode_fiber | multi_mode_fiber | cat5e | cat6 | cat6a | coax | wireless | ac_power | dc_power | poe | other',
            example: 'cat6',
          },
          {
            name: 'status',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by status',
            validation: 'active | inactive | monitoring | reserved',
            example: 'active',
          },
          {
            name: 'device_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by device UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          {
            name: 'room_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by room UUID (for patch panels)',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174001',
          },
          {
            name: 'native_network_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by native/untagged VLAN UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174002',
          },
          {
            name: 'trunk_mode',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by trunk mode',
            validation: 'access | trunk | hybrid | n/a',
            example: 'trunk',
          },
          {
            name: 'page',
            in: 'query',
            type: 'number',
            required: false,
            default: 1,
            description: 'Page number for pagination',
            example: 1,
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Number of results per page (max 100)',
            validation: '1-100',
            example: 50,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'created_at',
            description: 'Sort by field',
            validation:
              'interface_name | interface_type | status | port_number | created_at | updated_at',
            example: 'interface_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'desc',
            description: 'Sort order',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'IOs list with pagination',
            example: {
              success: true,
              data: {
                ios: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174010',
                    device_id: '123e4567-e89b-12d3-a456-426614174000',
                    room_id: null,
                    native_network_id: '123e4567-e89b-12d3-a456-426614174002',
                    connected_to_io_id: null,
                    interface_name: 'GigabitEthernet0/1',
                    interface_type: 'ethernet',
                    media_type: 'cat6',
                    status: 'active',
                    speed: '1000',
                    duplex: 'full',
                    trunk_mode: 'trunk',
                    port_number: '1',
                    mac_address: '00:1A:2B:3C:4D:5E',
                    created_at: '2025-01-15T10:30:00Z',
                    updated_at: '2025-01-15T10:30:00Z',
                  },
                ],
                total: 150,
                page: 1,
                limit: 50,
              },
            },
          },
        ],
        examples: [
          {
            title: 'List trunk ports',
            request: {
              method: 'GET',
              url: '/api/ios?trunk_mode=trunk&interface_type=ethernet',
              headers: { Authorization: 'Bearer YOUR_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { ios: [], total: 0 } },
            },
          },
        ],
      },
      {
        path: '/api/ios',
        method: 'POST',
        description: 'Create a new interface/port.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          description: 'IO creation data',
          schema: {
            type: 'object',
            required: ['interface_name', 'interface_type'],
            properties: {
              device_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Parent device UUID',
              },
              room_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Room UUID (for patch panels)',
              },
              native_network_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Native/untagged VLAN UUID',
              },
              connected_to_io_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Connected IO UUID for topology',
              },
              interface_name: {
                type: 'string',
                maxLength: 255,
                description: 'Interface name (e.g., eth0, GigE0/1)',
              },
              interface_type: {
                type: 'string',
                enum: [
                  'ethernet',
                  'wifi',
                  'virtual',
                  'fiber_optic',
                  'sdi',
                  'hdmi',
                  'xlr',
                  'usb',
                  'thunderbolt',
                  'displayport',
                  'coax',
                  'serial',
                  'patch_panel_port',
                  'power_input',
                  'power_output',
                  'other',
                ],
                description: 'Type of interface',
              },
              media_type: {
                type: 'string',
                enum: [
                  'single_mode_fiber',
                  'multi_mode_fiber',
                  'cat5e',
                  'cat6',
                  'cat6a',
                  'coax',
                  'wireless',
                  'ac_power',
                  'dc_power',
                  'poe',
                  'other',
                ],
                nullable: true,
                description: 'Media/cable type',
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'monitoring', 'reserved'],
                default: 'active',
                description: 'Interface status',
              },
              speed: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Link speed (e.g., 1000, 10G)',
              },
              duplex: {
                type: 'string',
                enum: ['full', 'half', 'auto', 'n/a'],
                nullable: true,
                description: 'Duplex mode',
              },
              trunk_mode: {
                type: 'string',
                enum: ['access', 'trunk', 'hybrid', 'n/a'],
                nullable: true,
                description: 'VLAN trunk mode',
              },
              port_number: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Physical port number',
              },
              mac_address: {
                type: 'string',
                maxLength: 17,
                nullable: true,
                description: 'MAC address',
              },
              voltage: {
                type: 'string',
                maxLength: 20,
                nullable: true,
                description: 'Voltage (for power IOs)',
              },
              amperage: {
                type: 'string',
                maxLength: 20,
                nullable: true,
                description: 'Amperage (for power IOs)',
              },
              wattage: {
                type: 'string',
                maxLength: 20,
                nullable: true,
                description: 'Wattage (for power IOs)',
              },
              power_connector_type: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Power connector type',
              },
              description: { type: 'string', nullable: true, description: 'Interface description' },
              notes: { type: 'string', nullable: true, description: 'Additional notes' },
            },
          },
          example: {
            device_id: '123e4567-e89b-12d3-a456-426614174000',
            interface_name: 'GigabitEthernet0/2',
            interface_type: 'ethernet',
            media_type: 'cat6',
            status: 'active',
            speed: '1000',
            duplex: 'full',
            trunk_mode: 'access',
            native_network_id: '123e4567-e89b-12d3-a456-426614174002',
            port_number: '2',
            description: 'Connection to distribution switch',
          },
        },
        responses: [
          {
            status: 201,
            description: 'IO created successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174011',
                device_id: '123e4567-e89b-12d3-a456-426614174000',
                interface_name: 'GigabitEthernet0/2',
                interface_type: 'ethernet',
                created_at: '2025-01-15T10:30:00Z',
              },
              message: 'IO created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/ios/[id]',
        method: 'GET',
        description: 'Retrieve a specific interface/port by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'IO UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174010',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'IO details',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174010',
                device_id: '123e4567-e89b-12d3-a456-426614174000',
                interface_name: 'GigabitEthernet0/1',
                interface_type: 'ethernet',
                media_type: 'cat6',
                status: 'active',
                speed: '1000',
                trunk_mode: 'trunk',
                created_at: '2025-01-15T10:30:00Z',
                updated_at: '2025-01-15T10:30:00Z',
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/ios/[id]',
        method: 'PUT',
        description: 'Update an existing interface/port.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'IO UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174010',
          },
        ],
        requestBody: {
          contentType: 'application/json',
          description: 'Fields to update (all optional)',
          schema: {
            type: 'object',
            properties: {
              device_id: { type: 'string', format: 'uuid', nullable: true },
              room_id: { type: 'string', format: 'uuid', nullable: true },
              native_network_id: { type: 'string', format: 'uuid', nullable: true },
              connected_to_io_id: { type: 'string', format: 'uuid', nullable: true },
              interface_name: { type: 'string', maxLength: 255 },
              interface_type: { type: 'string' },
              status: { type: 'string' },
              speed: { type: 'string', maxLength: 50, nullable: true },
              description: { type: 'string', nullable: true },
            },
          },
          example: {
            status: 'monitoring',
            description: 'Updated description',
          },
        },
        responses: [
          {
            status: 200,
            description: 'IO updated successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174010',
                status: 'monitoring',
                description: 'Updated description',
                updated_at: '2025-01-15T11:00:00Z',
              },
              message: 'IO updated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/ios/[id]',
        method: 'DELETE',
        description: 'Delete an interface/port. Requires admin role.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'IO UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174010',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'IO deleted successfully',
            example: {
              success: true,
              message: 'IO deleted successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'IP Addresses',
    slug: 'ip-addresses',
    description: 'Manage IPv4 and IPv6 addresses associated with interfaces and networks.',
    endpoints: [
      {
        path: '/api/ip-addresses',
        method: 'GET',
        description: 'List all IP addresses with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by IP address or DNS name',
            example: '192.168.1',
          },
          {
            name: 'ip_version',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by IP version',
            validation: 'v4 | v6',
            example: 'v4',
          },
          {
            name: 'type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by IP address type',
            validation: 'static | dhcp | reserved | floating',
            example: 'static',
          },
          {
            name: 'io_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by interface UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174010',
          },
          {
            name: 'network_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by network UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174002',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Number of results per page (max 100)',
            validation: '1-100',
            example: 50,
          },
          {
            name: 'offset',
            in: 'query',
            type: 'number',
            required: false,
            default: 0,
            description: 'Number of results to skip',
            example: 0,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'ip_address',
            description: 'Sort by field',
            validation: 'ip_address | dns_name | assignment_date | created_at',
            example: 'ip_address',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'asc',
            description: 'Sort order',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'IP addresses list with pagination',
            example: {
              success: true,
              data: {
                ip_addresses: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174020',
                    io_id: '123e4567-e89b-12d3-a456-426614174010',
                    network_id: '123e4567-e89b-12d3-a456-426614174002',
                    ip_address: '192.168.1.10',
                    ip_version: 'v4',
                    type: 'static',
                    dns_name: 'server01.example.com',
                    assignment_date: '2025-01-10',
                    notes: 'Primary web server',
                    created_at: '2025-01-10T09:00:00Z',
                    updated_at: '2025-01-10T09:00:00Z',
                  },
                ],
                total: 450,
                limit: 50,
                offset: 0,
              },
            },
          },
        ],
        examples: [
          {
            title: 'List static IPv4 addresses',
            request: {
              method: 'GET',
              url: '/api/ip-addresses?ip_version=v4&type=static',
              headers: { Authorization: 'Bearer YOUR_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { ip_addresses: [], total: 0 } },
            },
          },
        ],
      },
      {
        path: '/api/ip-addresses',
        method: 'POST',
        description: 'Create a new IP address assignment.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          description: 'IP address creation data',
          schema: {
            type: 'object',
            required: ['ip_address'],
            properties: {
              io_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Interface UUID',
              },
              network_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Network UUID',
              },
              ip_address: {
                type: 'string',
                maxLength: 50,
                description: 'IPv4 or IPv6 address (validated)',
              },
              ip_version: {
                type: 'string',
                enum: ['v4', 'v6'],
                nullable: true,
                description: 'IP version (auto-detected if not specified)',
              },
              type: {
                type: 'string',
                enum: ['static', 'dhcp', 'reserved', 'floating'],
                nullable: true,
                description: 'IP address type',
              },
              dns_name: {
                type: 'string',
                maxLength: 255,
                nullable: true,
                description: 'DNS hostname',
              },
              assignment_date: {
                type: 'string',
                format: 'date',
                nullable: true,
                description: 'Assignment date (YYYY-MM-DD)',
              },
              notes: { type: 'string', nullable: true, description: 'Additional notes' },
            },
          },
          example: {
            io_id: '123e4567-e89b-12d3-a456-426614174010',
            network_id: '123e4567-e89b-12d3-a456-426614174002',
            ip_address: '192.168.1.15',
            ip_version: 'v4',
            type: 'static',
            dns_name: 'app01.example.com',
            assignment_date: '2025-01-15',
            notes: 'Application server',
          },
        },
        responses: [
          {
            status: 201,
            description: 'IP address created successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174021',
                ip_address: '192.168.1.15',
                ip_version: 'v4',
                type: 'static',
                dns_name: 'app01.example.com',
                created_at: '2025-01-15T10:30:00Z',
              },
              message: 'IP address created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/ip-addresses/[id]',
        method: 'GET',
        description: 'Retrieve a specific IP address by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'IP address UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174020',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'IP address details',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174020',
                io_id: '123e4567-e89b-12d3-a456-426614174010',
                network_id: '123e4567-e89b-12d3-a456-426614174002',
                ip_address: '192.168.1.10',
                ip_version: 'v4',
                type: 'static',
                dns_name: 'server01.example.com',
                created_at: '2025-01-10T09:00:00Z',
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/ip-addresses/[id]',
        method: 'PUT',
        description: 'Update an existing IP address assignment.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'IP address UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174020',
          },
        ],
        requestBody: {
          contentType: 'application/json',
          description: 'Fields to update (all optional)',
          schema: {
            type: 'object',
            properties: {
              io_id: { type: 'string', format: 'uuid', nullable: true },
              network_id: { type: 'string', format: 'uuid', nullable: true },
              ip_address: { type: 'string', maxLength: 50 },
              type: {
                type: 'string',
                enum: ['static', 'dhcp', 'reserved', 'floating'],
                nullable: true,
              },
              dns_name: { type: 'string', maxLength: 255, nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            dns_name: 'server01-new.example.com',
            notes: 'Updated hostname',
          },
        },
        responses: [
          {
            status: 200,
            description: 'IP address updated successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174020',
                dns_name: 'server01-new.example.com',
                notes: 'Updated hostname',
                updated_at: '2025-01-15T11:00:00Z',
              },
              message: 'IP address updated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/ip-addresses/[id]',
        method: 'DELETE',
        description: 'Delete an IP address assignment. Requires admin role.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'IP address UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174020',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'IP address deleted successfully',
            example: {
              success: true,
              message: 'IP address deleted successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Software',
    slug: 'software',
    description:
      'Manage software products in the catalog. Software represents vendor products independent of specific installations or services.',
    endpoints: [
      {
        path: '/api/software',
        method: 'GET',
        description:
          'List all software products with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by product name, description, or website',
            example: 'Adobe',
          },
          {
            name: 'software_category',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by software category',
            validation:
              'productivity | security | development | communication | infrastructure | collaboration | broadcast | media | other',
            example: 'productivity',
          },
          {
            name: 'company_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by vendor/manufacturer company UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Number of results per page (max 100)',
            validation: '1-100',
            example: 50,
          },
          {
            name: 'offset',
            in: 'query',
            type: 'number',
            required: false,
            default: 0,
            description: 'Number of results to skip',
            example: 0,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'product_name',
            description: 'Sort by field',
            validation: 'product_name | software_category | created_at',
            example: 'product_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'asc',
            description: 'Sort order',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Software list with pagination',
            example: {
              success: true,
              data: {
                software: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174030',
                    company_id: '123e4567-e89b-12d3-a456-426614174000',
                    product_name: 'Adobe Premiere Pro',
                    description: 'Professional video editing software',
                    website: 'https://www.adobe.com/premiere',
                    software_category: 'media',
                    notes: 'Primary editing platform',
                    created_at: '2025-01-10T09:00:00Z',
                    updated_at: '2025-01-10T09:00:00Z',
                  },
                ],
                total: 85,
                limit: 50,
                offset: 0,
              },
            },
          },
        ],
        examples: [
          {
            title: 'List productivity software',
            request: {
              method: 'GET',
              url: '/api/software?software_category=productivity',
              headers: { Authorization: 'Bearer YOUR_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { software: [], total: 0 } },
            },
          },
        ],
      },
      {
        path: '/api/software',
        method: 'POST',
        description: 'Create a new software product in the catalog.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          description: 'Software creation data',
          schema: {
            type: 'object',
            required: ['product_name'],
            properties: {
              company_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Vendor/manufacturer company UUID',
              },
              product_name: { type: 'string', maxLength: 255, description: 'Product name' },
              description: { type: 'string', nullable: true, description: 'Product description' },
              website: {
                type: 'string',
                maxLength: 255,
                nullable: true,
                description: 'Product website URL',
              },
              software_category: {
                type: 'string',
                enum: [
                  'productivity',
                  'security',
                  'development',
                  'communication',
                  'infrastructure',
                  'collaboration',
                  'broadcast',
                  'media',
                  'other',
                ],
                nullable: true,
                description: 'Software category',
              },
              notes: { type: 'string', nullable: true, description: 'Additional notes' },
            },
          },
          example: {
            company_id: '123e4567-e89b-12d3-a456-426614174000',
            product_name: 'Final Cut Pro',
            description: 'Professional video editing software for macOS',
            website: 'https://www.apple.com/final-cut-pro/',
            software_category: 'media',
            notes: 'Alternative editing platform',
          },
        },
        responses: [
          {
            status: 201,
            description: 'Software created successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174031',
                product_name: 'Final Cut Pro',
                software_category: 'media',
                created_at: '2025-01-15T10:30:00Z',
              },
              message: 'Software created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/software/[id]',
        method: 'GET',
        description: 'Retrieve a specific software product by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Software UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174030',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Software details',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174030',
                company_id: '123e4567-e89b-12d3-a456-426614174000',
                product_name: 'Adobe Premiere Pro',
                description: 'Professional video editing software',
                website: 'https://www.adobe.com/premiere',
                software_category: 'media',
                created_at: '2025-01-10T09:00:00Z',
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/software/[id]',
        method: 'PUT',
        description: 'Update an existing software product.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Software UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174030',
          },
        ],
        requestBody: {
          contentType: 'application/json',
          description: 'Fields to update (all optional)',
          schema: {
            type: 'object',
            properties: {
              company_id: { type: 'string', format: 'uuid', nullable: true },
              product_name: { type: 'string', maxLength: 255 },
              description: { type: 'string', nullable: true },
              website: { type: 'string', maxLength: 255, nullable: true },
              software_category: { type: 'string', nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            website: 'https://www.adobe.com/products/premiere.html',
            notes: 'Updated product URL',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Software updated successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174030',
                website: 'https://www.adobe.com/products/premiere.html',
                notes: 'Updated product URL',
                updated_at: '2025-01-15T11:00:00Z',
              },
              message: 'Software updated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/software/[id]',
        method: 'DELETE',
        description: 'Delete a software product. Requires admin role.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Software UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174030',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Software deleted successfully',
            example: {
              success: true,
              message: 'Software deleted successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'SaaS Services',
    slug: 'saas-services',
    description:
      'Manage SaaS service instances including subscriptions, SSO/SCIM configuration, and service-to-service integrations.',
    endpoints: [
      {
        path: '/api/saas-services',
        method: 'GET',
        description: 'List all SaaS services with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by service name, URL, or account ID',
            example: 'Slack',
          },
          {
            name: 'environment',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by environment',
            validation: 'production | staging | dev | sandbox',
            example: 'production',
          },
          {
            name: 'status',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by status',
            validation: 'active | trial | inactive | cancelled',
            example: 'active',
          },
          {
            name: 'criticality',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by business criticality',
            validation: 'critical | high | medium | low',
            example: 'critical',
          },
          {
            name: 'software_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by software product UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174030',
          },
          {
            name: 'business_owner_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by business owner person UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174005',
          },
          {
            name: 'sso_enabled',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by SSO configuration',
            validation: 'true | false',
            example: 'true',
          },
          {
            name: 'scim_enabled',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by SCIM provisioning',
            validation: 'true | false',
            example: 'true',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Number of results per page (max 100)',
            validation: '1-100',
            example: 50,
          },
          {
            name: 'offset',
            in: 'query',
            type: 'number',
            required: false,
            default: 0,
            description: 'Number of results to skip',
            example: 0,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'service_name',
            description: 'Sort by field',
            validation:
              'service_name | status | environment | criticality | subscription_end | created_at',
            example: 'service_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'asc',
            description: 'Sort order',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'SaaS services list with pagination',
            example: {
              success: true,
              data: {
                saas_services: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174040',
                    software_id: '123e4567-e89b-12d3-a456-426614174030',
                    service_name: 'Slack Production',
                    service_url: 'https://yourcompany.slack.com',
                    environment: 'production',
                    status: 'active',
                    seat_count: 250,
                    cost: 2000.0,
                    criticality: 'high',
                    sso_provider: 'Okta',
                    scim_enabled: true,
                    subscription_end: '2025-12-31',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2025-01-10T09:00:00Z',
                  },
                ],
                total: 42,
                limit: 50,
                offset: 0,
              },
            },
          },
        ],
        examples: [
          {
            title: 'List critical production services',
            request: {
              method: 'GET',
              url: '/api/saas-services?environment=production&criticality=critical',
              headers: { Authorization: 'Bearer YOUR_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { saas_services: [], total: 0 } },
            },
          },
        ],
      },
      {
        path: '/api/saas-services',
        method: 'POST',
        description: 'Create a new SaaS service instance.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          description: 'SaaS service creation data',
          schema: {
            type: 'object',
            required: ['service_name'],
            properties: {
              software_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Software product UUID',
              },
              company_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Vendor company UUID',
              },
              business_owner_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Business owner person UUID',
              },
              technical_contact_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Technical contact person UUID',
              },
              service_name: {
                type: 'string',
                maxLength: 255,
                description: 'Service instance name',
              },
              service_url: {
                type: 'string',
                maxLength: 255,
                nullable: true,
                description: 'Service URL',
              },
              account_id: {
                type: 'string',
                maxLength: 255,
                nullable: true,
                description: 'Account/tenant ID',
              },
              environment: {
                type: 'string',
                enum: ['production', 'staging', 'dev', 'sandbox'],
                nullable: true,
                description: 'Environment type',
              },
              status: {
                type: 'string',
                enum: ['active', 'trial', 'inactive', 'cancelled'],
                default: 'active',
                description: 'Service status',
              },
              subscription_start: {
                type: 'string',
                format: 'date',
                nullable: true,
                description: 'Subscription start date',
              },
              subscription_end: {
                type: 'string',
                format: 'date',
                nullable: true,
                description: 'Subscription end date',
              },
              seat_count: {
                type: 'integer',
                minimum: 0,
                nullable: true,
                description: 'Number of licensed seats',
              },
              cost: {
                type: 'number',
                minimum: 0,
                nullable: true,
                description: 'Monthly/annual cost',
              },
              billing_frequency: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Billing frequency',
              },
              criticality: {
                type: 'string',
                enum: ['critical', 'high', 'medium', 'low'],
                nullable: true,
                description: 'Business criticality',
              },
              sso_provider: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'SSO provider name',
              },
              sso_protocol: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'SSO protocol (SAML, OIDC, etc.)',
              },
              scim_enabled: {
                type: 'boolean',
                default: false,
                description: 'SCIM provisioning enabled',
              },
              provisioning_type: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Provisioning method',
              },
              api_access_enabled: {
                type: 'boolean',
                default: false,
                description: 'API access enabled',
              },
              api_documentation_url: {
                type: 'string',
                maxLength: 255,
                nullable: true,
                description: 'API documentation URL',
              },
              notes: { type: 'string', nullable: true, description: 'Additional notes' },
            },
          },
          example: {
            software_id: '123e4567-e89b-12d3-a456-426614174030',
            service_name: 'GitHub Enterprise',
            service_url: 'https://github.com/yourcompany',
            environment: 'production',
            status: 'active',
            seat_count: 100,
            cost: 2100.0,
            billing_frequency: 'monthly',
            criticality: 'critical',
            sso_provider: 'Okta',
            sso_protocol: 'SAML 2.0',
            scim_enabled: true,
            subscription_start: '2024-01-01',
            subscription_end: '2025-12-31',
          },
        },
        responses: [
          {
            status: 201,
            description: 'SaaS service created successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174041',
                service_name: 'GitHub Enterprise',
                environment: 'production',
                status: 'active',
                created_at: '2025-01-15T10:30:00Z',
              },
              message: 'SaaS service created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/saas-services/[id]',
        method: 'GET',
        description: 'Retrieve a specific SaaS service by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'SaaS service UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174040',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'SaaS service details',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174040',
                service_name: 'Slack Production',
                environment: 'production',
                status: 'active',
                sso_provider: 'Okta',
                scim_enabled: true,
                created_at: '2024-01-01T00:00:00Z',
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/saas-services/[id]',
        method: 'PUT',
        description: 'Update an existing SaaS service.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'SaaS service UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174040',
          },
        ],
        requestBody: {
          contentType: 'application/json',
          description: 'Fields to update (all optional)',
          schema: {
            type: 'object',
            properties: {
              service_name: { type: 'string', maxLength: 255 },
              status: { type: 'string', enum: ['active', 'trial', 'inactive', 'cancelled'] },
              seat_count: { type: 'integer', minimum: 0, nullable: true },
              cost: { type: 'number', minimum: 0, nullable: true },
              subscription_end: { type: 'string', format: 'date', nullable: true },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            seat_count: 275,
            cost: 2200.0,
            subscription_end: '2026-12-31',
          },
        },
        responses: [
          {
            status: 200,
            description: 'SaaS service updated successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174040',
                seat_count: 275,
                cost: 2200.0,
                subscription_end: '2026-12-31',
                updated_at: '2025-01-15T11:00:00Z',
              },
              message: 'SaaS service updated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/saas-services/[id]',
        method: 'DELETE',
        description: 'Delete a SaaS service. Requires admin role.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'SaaS service UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174040',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'SaaS service deleted successfully',
            example: {
              success: true,
              message: 'SaaS service deleted successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Installed Applications',
    slug: 'installed-applications',
    description:
      'Manage deployed application versions including install methods, deployment platforms, and auto-update settings.',
    endpoints: [
      {
        path: '/api/installed-applications',
        method: 'GET',
        description:
          'List all installed applications with filtering, searching, and pagination support.',
        authentication: 'none',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search by application name, version, or package ID',
            example: 'Chrome',
          },
          {
            name: 'software_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by software product UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174030',
          },
          {
            name: 'deployment_status',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by deployment status',
            validation: 'pilot | production | deprecated | retired',
            example: 'production',
          },
          {
            name: 'deployment_platform',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by deployment platform (e.g., Jamf, Intune)',
            example: 'Jamf',
          },
          {
            name: 'auto_update_enabled',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by auto-update setting',
            validation: 'true | false',
            example: 'true',
          },
          {
            name: 'device_id',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by devices with this application installed',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'number',
            required: false,
            default: 50,
            description: 'Number of results per page (max 100)',
            validation: '1-100',
            example: 50,
          },
          {
            name: 'offset',
            in: 'query',
            type: 'number',
            required: false,
            default: 0,
            description: 'Number of results to skip',
            example: 0,
          },
          {
            name: 'sort_by',
            in: 'query',
            type: 'string',
            required: false,
            default: 'application_name',
            description: 'Sort by field',
            validation:
              'application_name | version | deployment_status | install_date | created_at | updated_at',
            example: 'application_name',
          },
          {
            name: 'sort_order',
            in: 'query',
            type: 'string',
            required: false,
            default: 'asc',
            description: 'Sort order',
            validation: 'asc | desc',
            example: 'asc',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Installed applications list with pagination',
            example: {
              success: true,
              data: {
                installed_applications: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174050',
                    software_id: '123e4567-e89b-12d3-a456-426614174030',
                    application_name: 'Google Chrome',
                    version: '120.0.6099.109',
                    install_method: 'MDM',
                    deployment_platform: 'Jamf',
                    package_id: 'com.google.chrome',
                    deployment_status: 'production',
                    install_date: '2024-12-01',
                    auto_update_enabled: true,
                    notes: 'Enterprise deployment',
                    created_at: '2024-12-01T09:00:00Z',
                    updated_at: '2025-01-15T10:00:00Z',
                  },
                ],
                total: 125,
                limit: 50,
                offset: 0,
              },
            },
          },
        ],
        examples: [
          {
            title: 'List production deployments',
            request: {
              method: 'GET',
              url: '/api/installed-applications?deployment_status=production',
              headers: { Authorization: 'Bearer YOUR_TOKEN' },
            },
            response: {
              status: 200,
              body: { success: true, data: { installed_applications: [], total: 0 } },
            },
          },
        ],
      },
      {
        path: '/api/installed-applications',
        method: 'POST',
        description: 'Create a new installed application record.',
        authentication: 'none',
        requestBody: {
          contentType: 'application/json',
          description: 'Installed application creation data',
          schema: {
            type: 'object',
            required: ['application_name'],
            properties: {
              software_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
                description: 'Software product UUID',
              },
              application_name: { type: 'string', maxLength: 255, description: 'Application name' },
              version: {
                type: 'string',
                maxLength: 100,
                nullable: true,
                description: 'Version number',
              },
              install_method: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Installation method (MDM, Manual, Script, etc.)',
              },
              deployment_platform: {
                type: 'string',
                maxLength: 50,
                nullable: true,
                description: 'Deployment platform (Jamf, Intune, SCCM, etc.)',
              },
              package_id: {
                type: 'string',
                maxLength: 255,
                nullable: true,
                description: 'Package identifier',
              },
              deployment_status: {
                type: 'string',
                enum: ['pilot', 'production', 'deprecated', 'retired'],
                nullable: true,
                description: 'Deployment status',
              },
              install_date: {
                type: 'string',
                format: 'date',
                nullable: true,
                description: 'Installation date',
              },
              auto_update_enabled: {
                type: 'boolean',
                nullable: true,
                description: 'Auto-update enabled',
              },
              notes: { type: 'string', nullable: true, description: 'Additional notes' },
            },
          },
          example: {
            software_id: '123e4567-e89b-12d3-a456-426614174030',
            application_name: 'Slack',
            version: '4.36.140',
            install_method: 'MDM',
            deployment_platform: 'Jamf',
            package_id: 'com.tinyspeck.slackmacgap',
            deployment_status: 'production',
            install_date: '2025-01-10',
            auto_update_enabled: true,
          },
        },
        responses: [
          {
            status: 201,
            description: 'Installed application created successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174051',
                application_name: 'Slack',
                version: '4.36.140',
                deployment_status: 'production',
                created_at: '2025-01-15T10:30:00Z',
              },
              message: 'Installed application created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/installed-applications/[id]',
        method: 'GET',
        description: 'Retrieve a specific installed application by ID.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Installed application UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174050',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Installed application details',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174050',
                application_name: 'Google Chrome',
                version: '120.0.6099.109',
                deployment_status: 'production',
                auto_update_enabled: true,
                created_at: '2024-12-01T09:00:00Z',
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/installed-applications/[id]',
        method: 'PUT',
        description: 'Update an existing installed application.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Installed application UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174050',
          },
        ],
        requestBody: {
          contentType: 'application/json',
          description: 'Fields to update (all optional)',
          schema: {
            type: 'object',
            properties: {
              version: { type: 'string', maxLength: 100 },
              deployment_status: {
                type: 'string',
                enum: ['pilot', 'production', 'deprecated', 'retired'],
              },
              auto_update_enabled: { type: 'boolean' },
              notes: { type: 'string', nullable: true },
            },
          },
          example: {
            version: '121.0.6167.85',
            notes: 'Updated to latest version',
          },
        },
        responses: [
          {
            status: 200,
            description: 'Installed application updated successfully',
            example: {
              success: true,
              data: {
                id: '123e4567-e89b-12d3-a456-426614174050',
                version: '121.0.6167.85',
                notes: 'Updated to latest version',
                updated_at: '2025-01-15T11:00:00Z',
              },
              message: 'Installed application updated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/installed-applications/[id]',
        method: 'DELETE',
        description: 'Delete an installed application record. Requires admin role.',
        authentication: 'none',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Installed application UUID',
            validation: 'Valid UUID format',
            example: '123e4567-e89b-12d3-a456-426614174050',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Installed application deleted successfully',
            example: {
              success: true,
              message: 'Installed application deleted successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Roles & Permissions (RBAC)',
    slug: 'roles',
    description:
      'Role-based access control management with hierarchical roles and object-level permissions.',
    endpoints: [
      {
        path: '/api/roles',
        method: 'GET',
        description: 'Get all roles with optional filtering.',
        authentication: 'required',
        roleRequired: 'admin',
        parameters: [
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search roles by name or description',
          },
          {
            name: 'is_system',
            in: 'query',
            type: 'boolean',
            required: false,
            description: 'Filter by system roles (true) or custom roles (false)',
          },
          {
            name: 'page',
            in: 'query',
            type: 'integer',
            required: false,
            description: 'Page number for pagination (default: 1)',
            validation: 'Minimum: 1',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'integer',
            required: false,
            description: 'Number of results per page (default: 50, max: 100)',
            validation: 'Range: 1-100',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: [
                {
                  id: 'uuid',
                  role_name: 'Network Administrator',
                  description: 'Manages network infrastructure',
                  parent_role_id: null,
                  is_system: false,
                  created_at: '2025-01-15T10:00:00Z',
                  updated_at: '2025-01-15T10:00:00Z',
                  permissions: [
                    {
                      object_type: 'network',
                      can_view: true,
                      can_edit: true,
                      can_delete: false,
                      can_manage_permissions: false,
                    },
                  ],
                },
              ],
              pagination: {
                page: 1,
                limit: 50,
                total: 12,
                total_pages: 1,
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/roles',
        method: 'POST',
        description: 'Create a new role with permissions.',
        authentication: 'none',
        parameters: [
          {
            name: 'role_name',
            in: 'header',
            type: 'string',
            required: true,
            description: 'Unique role name',
            validation: 'Max length: 100',
          },
          {
            name: 'description',
            in: 'header',
            type: 'string',
            required: false,
            description: 'Role description',
          },
          {
            name: 'parent_role_id',
            in: 'header',
            type: 'uuid',
            required: false,
            description: 'Parent role ID for hierarchical roles',
          },
          {
            name: 'permissions',
            in: 'header',
            type: 'array',
            required: false,
            description: 'Array of permission objects',
          },
        ],
        responses: [
          {
            status: 201,
            description: 'Role created successfully',
            example: {
              success: true,
              data: {
                id: 'uuid',
                role_name: 'Network Administrator',
                description: 'Manages network infrastructure',
                parent_role_id: null,
                is_system: false,
                created_at: '2025-01-15T10:00:00Z',
                updated_at: '2025-01-15T10:00:00Z',
              },
              message: 'Role created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/roles/[id]',
        method: 'GET',
        description: 'Get a specific role with all permissions and assignments.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'uuid',
            required: true,
            description: 'Role UUID',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: {
                id: 'uuid',
                role_name: 'Network Administrator',
                description: 'Manages network infrastructure',
                parent_role_id: null,
                is_system: false,
                created_at: '2025-01-15T10:00:00Z',
                updated_at: '2025-01-15T10:00:00Z',
                permissions: [
                  {
                    object_type: 'network',
                    can_view: true,
                    can_edit: true,
                    can_delete: false,
                    can_manage_permissions: false,
                  },
                ],
                assignments: [
                  {
                    person_id: 'uuid',
                    person_name: 'John Doe',
                    scope: 'global',
                    assigned_at: '2025-01-15T10:00:00Z',
                  },
                ],
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/roles/[id]',
        method: 'PUT',
        description: 'Update role details and permissions. System roles cannot be modified.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'uuid',
            required: true,
            description: 'Role UUID',
          },
          {
            name: 'role_name',
            in: 'header',
            type: 'string',
            required: false,
            description: 'Role name',
            validation: 'Max length: 100',
          },
          {
            name: 'description',
            in: 'header',
            type: 'string',
            required: false,
            description: 'Role description',
          },
          {
            name: 'permissions',
            in: 'header',
            type: 'array',
            required: false,
            description: 'Updated permissions array',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Role updated successfully',
            example: {
              success: true,
              data: {
                id: 'uuid',
                role_name: 'Network Administrator',
                description: 'Updated description',
                updated_at: '2025-01-15T11:00:00Z',
              },
              message: 'Role updated successfully',
            },
          },
          {
            status: 403,
            description: 'Cannot modify system role',
            example: {
              success: false,
              error: 'System roles cannot be modified',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Export',
    slug: 'export',
    description: 'Export data to CSV format with filtering support.',
    endpoints: [
      {
        path: '/api/export/[objectType]',
        method: 'GET',
        description:
          'Export data to CSV format. Supports devices, people, locations, rooms, companies, and networks. All query filters from list endpoints are supported.',
        authentication: 'none',
        parameters: [
          {
            name: 'objectType',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Object type to export',
            validation: 'One of: devices, people, locations, rooms, companies, networks',
          },
          {
            name: 'search',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Search filter (varies by object type)',
          },
          {
            name: 'location_id',
            in: 'query',
            type: 'uuid',
            required: false,
            description: 'Filter by location (for devices, rooms, people)',
          },
          {
            name: 'status',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by status (varies by object type)',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'CSV file download',
            example: {
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="devices_2025-01-15T10-30-00.csv"',
              },
              body: 'CSV file content...',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Admin - System Settings',
    slug: 'admin-settings',
    description: 'Manage system-wide settings including branding, storage, and authentication.',
    endpoints: [
      {
        path: '/api/admin/settings',
        method: 'GET',
        description: 'Get all system settings or filter by category.',
        authentication: 'none',
        parameters: [
          {
            name: 'category',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by settings category',
            validation: 'One of: branding, authentication, storage, notifications, general',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: [
                {
                  id: 'uuid',
                  setting_key: 'branding.site_name',
                  setting_value: 'M.O.S.S.',
                  category: 'branding',
                  description: 'Site name displayed in header',
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-15T10:00:00Z',
                },
              ],
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/admin/settings',
        method: 'PUT',
        description: 'Update one or more system settings. Logs changes to audit log.',
        authentication: 'none',
        parameters: [
          {
            name: 'settings',
            in: 'header',
            type: 'object',
            required: true,
            description: 'Key-value pairs of settings to update',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Settings updated successfully',
            example: {
              success: true,
              data: {
                updated: ['branding.site_name', 'branding.primary_color'],
              },
              message: 'Settings updated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/admin/settings/branding',
        method: 'GET',
        description: 'Get all branding settings (site name, logo, colors).',
        authentication: 'none',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: {
                site_name: 'M.O.S.S.',
                logo_url: 'https://example.com/logo.png',
                favicon_url: 'https://example.com/favicon.ico',
                primary_color: '#1C7FF2',
                background_color: '#FAF9F5',
                text_color: '#231F20',
                accent_color: '#28C077',
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/admin/settings/storage',
        method: 'PUT',
        description: 'Update storage backend configuration (local, NFS, SMB, S3).',
        authentication: 'none',
        parameters: [
          {
            name: 'backend',
            in: 'header',
            type: 'string',
            required: true,
            description: 'Storage backend type',
            validation: 'One of: local, nfs, smb, s3',
          },
          {
            name: 'config',
            in: 'header',
            type: 'object',
            required: true,
            description: 'Backend-specific configuration (varies by backend)',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Storage settings updated',
            example: {
              success: true,
              message: 'Storage backend updated successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Admin - Integrations',
    slug: 'admin-integrations',
    description: 'Manage external system integrations (MDM, IdP, RMM, ticketing, monitoring).',
    endpoints: [
      {
        path: '/api/admin/integrations',
        method: 'GET',
        description: 'Get all configured integrations.',
        authentication: 'none',
        parameters: [
          {
            name: 'type',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by integration type',
            validation:
              'One of: idp, mdm, rmm, cloud_provider, ticketing, monitoring, backup, other',
          },
          {
            name: 'enabled',
            in: 'query',
            type: 'boolean',
            required: false,
            description: 'Filter by enabled status',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: [
                {
                  id: 'uuid',
                  integration_name: 'Jamf Pro',
                  integration_type: 'mdm',
                  provider: 'jamf',
                  enabled: true,
                  config: {
                    url: 'https://example.jamfcloud.com',
                    api_user: 'api-user',
                    api_token: '****',
                  },
                  sync_frequency: 'daily',
                  last_sync_at: '2025-01-15T02:00:00Z',
                  last_sync_status: 'success',
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-15T02:00:00Z',
                },
              ],
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/admin/integrations',
        method: 'POST',
        description: 'Create a new integration configuration.',
        authentication: 'none',
        parameters: [
          {
            name: 'integration_name',
            in: 'header',
            type: 'string',
            required: true,
            description: 'Integration name',
            validation: 'Max length: 100',
          },
          {
            name: 'integration_type',
            in: 'header',
            type: 'string',
            required: true,
            description: 'Integration type',
            validation:
              'One of: idp, mdm, rmm, cloud_provider, ticketing, monitoring, backup, other',
          },
          {
            name: 'provider',
            in: 'header',
            type: 'string',
            required: true,
            description: 'Provider name',
            validation: 'Max length: 100',
          },
          {
            name: 'config',
            in: 'header',
            type: 'object',
            required: true,
            description: 'Provider-specific configuration (JSONB)',
          },
          {
            name: 'sync_frequency',
            in: 'header',
            type: 'string',
            required: false,
            description: 'Sync frequency',
            validation: 'One of: manual, hourly, daily, weekly',
          },
        ],
        responses: [
          {
            status: 201,
            description: 'Integration created',
            example: {
              success: true,
              data: {
                id: 'uuid',
                integration_name: 'Jamf Pro',
                integration_type: 'mdm',
                provider: 'jamf',
                enabled: true,
                created_at: '2025-01-15T10:00:00Z',
              },
              message: 'Integration created successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/admin/integrations/[id]/sync',
        method: 'POST',
        description: 'Manually trigger a sync for an integration. Creates a sync log entry.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'uuid',
            required: true,
            description: 'Integration UUID',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Sync initiated',
            example: {
              success: true,
              data: {
                sync_id: 'uuid',
                status: 'in_progress',
                started_at: '2025-01-15T10:00:00Z',
              },
              message: 'Sync initiated successfully',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/admin/integrations/[id]/logs',
        method: 'GET',
        description: 'Get sync logs for an integration with success/failure details.',
        authentication: 'none',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'uuid',
            required: true,
            description: 'Integration UUID',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'integer',
            required: false,
            description: 'Number of logs to return (default: 50, max: 100)',
            validation: 'Range: 1-100',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: [
                {
                  id: 'uuid',
                  integration_id: 'uuid',
                  status: 'success',
                  records_processed: 150,
                  records_created: 5,
                  records_updated: 145,
                  records_failed: 0,
                  error_message: null,
                  sync_details: {
                    duration_ms: 12500,
                    api_calls: 15,
                  },
                  started_at: '2025-01-15T02:00:00Z',
                  completed_at: '2025-01-15T02:00:12Z',
                },
              ],
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Admin - Audit Logs',
    slug: 'admin-audit',
    description: 'View administrative action audit trail for compliance and troubleshooting.',
    endpoints: [
      {
        path: '/api/admin/audit-logs',
        method: 'GET',
        description:
          'Get admin action audit logs with filtering by user, action, category, and date range.',
        authentication: 'none',
        parameters: [
          {
            name: 'user_id',
            in: 'query',
            type: 'uuid',
            required: false,
            description: 'Filter by user who performed the action',
          },
          {
            name: 'action',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by action type',
            validation:
              'Examples: setting_changed, integration_created, role_assigned, user_created, backup_restored',
          },
          {
            name: 'category',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by category',
            validation:
              'One of: branding, authentication, storage, integrations, rbac, users, backup, general',
          },
          {
            name: 'start_date',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by start date (ISO 8601)',
          },
          {
            name: 'end_date',
            in: 'query',
            type: 'string',
            required: false,
            description: 'Filter by end date (ISO 8601)',
          },
          {
            name: 'page',
            in: 'query',
            type: 'integer',
            required: false,
            description: 'Page number (default: 1)',
          },
          {
            name: 'limit',
            in: 'query',
            type: 'integer',
            required: false,
            description: 'Results per page (default: 50, max: 100)',
            validation: 'Range: 1-100',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: [
                {
                  id: 'uuid',
                  user_id: 'uuid',
                  user_name: 'Admin User',
                  action: 'setting_changed',
                  category: 'branding',
                  target_object_type: 'system_setting',
                  target_object_id: 'uuid',
                  details: {
                    setting: 'branding.site_name',
                    old_value: 'M.O.S.S.',
                    new_value: 'My Company MOSS',
                  },
                  ip_address: '192.168.1.100',
                  user_agent: 'Mozilla/5.0...',
                  created_at: '2025-01-15T10:00:00Z',
                },
              ],
              pagination: {
                page: 1,
                limit: 50,
                total: 237,
                total_pages: 5,
              },
            },
          },
        ],
        examples: [],
      },
    ],
  },
  {
    name: 'Authentication',
    slug: 'auth',
    description:
      'User authentication and session management with support for local, LDAP, and SAML.',
    endpoints: [
      {
        path: '/api/auth/signin',
        method: 'POST',
        description: 'Authenticate user with email/password or SSO provider.',
        authentication: 'none',
        parameters: [
          {
            name: 'email',
            in: 'header',
            type: 'string',
            required: true,
            description: 'User email address',
            validation: 'Valid email format',
          },
          {
            name: 'password',
            in: 'header',
            type: 'string',
            required: true,
            description: 'User password',
          },
        ],
        responses: [
          {
            status: 200,
            description: 'Authentication successful',
            example: {
              success: true,
              data: {
                user: {
                  id: 'uuid',
                  email: 'user@example.com',
                  role: 'admin',
                  person_id: 'uuid',
                  full_name: 'John Doe',
                },
                token: 'jwt-token-here',
                expires_at: '2025-01-16T10:00:00Z',
              },
              message: 'Authentication successful',
            },
          },
          {
            status: 401,
            description: 'Invalid credentials',
            example: {
              success: false,
              error: 'Invalid email or password',
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/auth/session',
        method: 'GET',
        description: 'Get current user session information.',
        authentication: 'none',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              success: true,
              data: {
                user: {
                  id: 'uuid',
                  email: 'user@example.com',
                  role: 'admin',
                  person_id: 'uuid',
                  full_name: 'John Doe',
                  is_active: true,
                },
                session: {
                  created_at: '2025-01-15T10:00:00Z',
                  expires_at: '2025-01-16T10:00:00Z',
                },
              },
            },
          },
        ],
        examples: [],
      },
      {
        path: '/api/auth/signout',
        method: 'POST',
        description: 'Sign out and invalidate current session.',
        authentication: 'none',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Signed out successfully',
            example: {
              success: true,
              message: 'Signed out successfully',
            },
          },
        ],
        examples: [],
      },
    ],
  },
]

/**
 * Get resource by slug
 */
export function getResourceBySlug(slug: string): ApiResource | undefined {
  return API_RESOURCES.find((resource) => resource.slug === slug)
}

/**
 * Get all resource slugs
 */
export function getAllResourceSlugs(): string[] {
  return API_RESOURCES.map((resource) => resource.slug)
}

/**
 * Common response examples
 */
export const COMMON_RESPONSES = {
  unauthorized: {
    status: 401,
    description: 'Authentication required',
    example: { success: false, error: 'Unauthorized' },
  },
  forbidden: {
    status: 403,
    description: 'Insufficient permissions',
    example: { success: false, error: 'Forbidden' },
  },
  notFound: {
    status: 404,
    description: 'Resource not found',
    example: { success: false, error: 'Resource not found' },
  },
  serverError: {
    status: 500,
    description: 'Internal server error',
    example: { success: false, error: 'An unexpected error occurred' },
  },
}
