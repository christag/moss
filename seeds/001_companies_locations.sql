/**
 * Seed data for companies and locations
 * Base data required for rooms and people
 */

-- Companies
INSERT INTO companies (id, company_name, company_type, website) VALUES
('00000000-0000-0000-0000-000000000001', 'Acme Corporation', 'own_organization', 'https://acmecorp.com'),
('00000000-0000-0000-0000-000000000002', 'Dell Technologies', 'vendor', 'https://dell.com'),
('00000000-0000-0000-0000-000000000003', 'Cisco Systems', 'vendor', 'https://cisco.com'),
('00000000-0000-0000-0000-000000000004', 'Microsoft Corporation', 'vendor', 'https://microsoft.com');

-- Locations  
INSERT INTO locations (id, location_name, company_id, address, city, state, zip, country) VALUES
('00000000-0000-0000-0001-000000000001', 'Headquarters', '00000000-0000-0000-0000-000000000001', '123 Tech Boulevard', 'San Francisco', 'CA', '94103', 'USA'),
('00000000-0000-0000-0001-000000000002', 'East Coast Office', '00000000-0000-0000-0000-000000000001', '456 Innovation Drive', 'New York', 'NY', '10001', 'USA'),
('00000000-0000-0000-0001-000000000003', 'Remote Data Center', '00000000-0000-0000-0000-000000000001', '789 Cloud Street', 'Austin', 'TX', '78701', 'USA');
