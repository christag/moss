/**
 * Seed data for people table
 * Creates sample employees, contractors, and vendor contacts with organizational hierarchy
 */

-- CEO (no manager)
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Sarah Chen',
  'sarah.chen@acmecorp.com',
  'schen',
  'EMP001',
  'employee',
  'Executive',
  'Chief Executive Officer',
  '415-555-0001',
  '415-555-1001',
  '2015-01-15',
  'active',
  NULL,
  'email',
  'Founded the company'
);

-- CTO (reports to CEO)
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Marcus Johnson',
  'marcus.johnson@acmecorp.com',
  'mjohnson',
  'EMP002',
  'employee',
  'IT',
  'Chief Technology Officer',
  '415-555-0002',
  '415-555-1002',
  '2015-03-01',
  'active',
  '10000000-0000-0000-0000-000000000001',
  'phone'
);

-- IT Director (reports to CTO)
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Aisha Patel',
  'aisha.patel@acmecorp.com',
  'apatel',
  'EMP003',
  'employee',
  'IT',
  'IT Director',
  '415-555-0003',
  '415-555-1003',
  '2017-06-15',
  'active',
  '10000000-0000-0000-0000-000000000002',
  'email'
);

-- Network Engineer (reports to IT Director)
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'James Rodriguez',
  'james.rodriguez@acmecorp.com',
  'jrodriguez',
  'EMP004',
  'employee',
  'IT',
  'Senior Network Engineer',
  '415-555-0004',
  '415-555-1004',
  '2018-02-01',
  'active',
  '10000000-0000-0000-0000-000000000003',
  'phone'
);

-- Systems Administrator (reports to IT Director)
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method
) VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Emily Wong',
  'emily.wong@acmecorp.com',
  'ewong',
  'EMP005',
  'employee',
  'IT',
  'Systems Administrator',
  '415-555-0005',
  '415-555-1005',
  '2019-08-20',
  'active',
  '10000000-0000-0000-0000-000000000003',
  'email'
);

-- IT Support Specialist (reports to IT Director)
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method
) VALUES (
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000002',
  'David Kim',
  'david.kim@acmecorp.com',
  'dkim',
  'EMP006',
  'employee',
  'IT',
  'IT Support Specialist',
  '212-555-0006',
  '212-555-1006',
  '2020-01-10',
  'active',
  '10000000-0000-0000-0000-000000000003',
  'phone'
);

-- Broadcast Engineer
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method
) VALUES (
  '10000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Rachel Foster',
  'rachel.foster@acmecorp.com',
  'rfoster',
  'EMP007',
  'employee',
  'Broadcast Operations',
  'Lead Broadcast Engineer',
  '415-555-0007',
  '415-555-1007',
  '2016-11-01',
  'active',
  '10000000-0000-0000-0000-000000000002',
  'email'
);

-- HR Manager
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method
) VALUES (
  '10000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Lisa Martinez',
  'lisa.martinez@acmecorp.com',
  'lmartinez',
  'EMP008',
  'employee',
  'Human Resources',
  'HR Manager',
  '415-555-0008',
  '415-555-1008',
  '2016-04-15',
  'active',
  '10000000-0000-0000-0000-000000000001',
  'email'
);

-- Contractor - Network Infrastructure
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000003',
  'Alex Thompson',
  'alex.thompson@contractor.com',
  'athompson',
  'CTR001',
  'contractor',
  'IT',
  'Network Consultant',
  '512-555-0009',
  '512-555-1009',
  '2023-01-15',
  'active',
  '10000000-0000-0000-0000-000000000004',
  'email',
  '6-month contract for network infrastructure upgrade'
);

-- Contractor - Security Specialist
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  person_type,
  department,
  job_title,
  phone,
  mobile,
  start_date,
  status,
  manager_id,
  preferred_contact_method,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Priya Sharma',
  'priya.sharma@securitycorp.com',
  NULL,
  'contractor',
  'IT',
  'Security Consultant',
  '415-555-0010',
  '415-555-1010',
  '2024-06-01',
  'active',
  '10000000-0000-0000-0000-000000000003',
  'phone',
  'Conducting security audit and implementing improvements'
);

-- Vendor Contact - Dell
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  person_type,
  job_title,
  phone,
  mobile,
  status,
  preferred_contact_method,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000011',
  NULL,
  NULL,
  'Michael Stevens',
  'michael.stevens@dell.com',
  'vendor_contact',
  'Account Executive',
  '800-555-3355',
  '408-555-0011',
  'active',
  'email',
  'Primary contact for Dell hardware purchases'
);

-- Vendor Contact - Cisco
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  person_type,
  job_title,
  phone,
  status,
  preferred_contact_method,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000012',
  NULL,
  NULL,
  'Jennifer Park',
  'jennifer.park@cisco.com',
  'vendor_contact',
  'Network Solutions Specialist',
  '800-553-6387',
  'active',
  'email',
  'Technical support and product recommendations for Cisco equipment'
);

-- Terminated Employee
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  username,
  employee_id,
  person_type,
  department,
  job_title,
  phone,
  start_date,
  status,
  manager_id,
  preferred_contact_method,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000002',
  'Tom Wilson',
  'tom.wilson@acmecorp.com',
  'twilson',
  'EMP009',
  'employee',
  'IT',
  'Junior IT Technician',
  '212-555-0013',
  '2021-03-15',
  'terminated',
  '10000000-0000-0000-0000-000000000003',
  'email',
  'Terminated 2023-12-31'
);

-- Inactive Contractor
INSERT INTO people (
  id,
  company_id,
  location_id,
  full_name,
  email,
  person_type,
  department,
  job_title,
  phone,
  start_date,
  status,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000001',
  'Carlos Mendez',
  'carlos.mendez@consultant.com',
  'contractor',
  'IT',
  'Database Consultant',
  '415-555-0014',
  '2022-01-01',
  'inactive',
  'Contract ended 2023-06-30'
);

-- Partner Contact
INSERT INTO people (
  id,
  full_name,
  email,
  person_type,
  job_title,
  phone,
  mobile,
  status,
  preferred_contact_method,
  notes
) VALUES (
  '10000000-0000-0000-0000-000000000015',
  'Amanda Baker',
  'amanda.baker@partnertech.com',
  'partner',
  'Integration Manager',
  '650-555-0015',
  '650-555-1015',
  'active',
  'email',
  'Technical liaison for PartnerTech integration projects'
);
