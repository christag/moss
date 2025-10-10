/**
 * Seed data for rooms
 * Creates sample rooms in the seeded locations
 */

-- Rooms at Headquarters (San Francisco)
INSERT INTO rooms (location_id, room_name, room_number, room_type, floor, capacity, access_requirements, notes) VALUES
('00000000-0000-0000-0001-000000000001', 'Server Room Alpha', '101', 'server_room', '1', NULL, 'Badge access required', 'Primary data center'),
('00000000-0000-0000-0001-000000000001', 'Conference Room A', '201', 'conference_room', '2', 12, NULL, 'Video conferencing enabled'),
('00000000-0000-0000-0001-000000000001', 'IT Office', '105', 'office', '1', NULL, 'IT team only', NULL);

-- Rooms at East Coast Office (New York)
INSERT INTO rooms (location_id, room_name, room_number, room_type, floor, capacity, access_requirements, notes) VALUES
('00000000-0000-0000-0001-000000000002', 'Server Closet', 'B1-05', 'closet', 'B1', NULL, 'Facilities and IT only', 'Network equipment closet'),
('00000000-0000-0000-0001-000000000002', 'Boardroom', '1501', 'conference_room', '15', 20, NULL, 'Executive conference room');

-- Rooms at Remote Data Center (Austin)
INSERT INTO rooms (location_id, room_name, room_number, room_type, floor, capacity, access_requirements, notes) VALUES
('00000000-0000-0000-0001-000000000003', 'Primary Server Room', 'DC-01', 'server_room', '1', NULL, 'Biometric + Badge required', 'Main production servers'),
('00000000-0000-0000-0001-000000000003', 'Backup Server Room', 'DC-02', 'server_room', '1', NULL, 'Biometric + Badge required', 'Disaster recovery systems'),
('00000000-0000-0000-0001-000000000003', 'Storage Area', 'DC-S1', 'storage', '1', NULL, 'Facilities only', 'Equipment storage');
