#!/usr/bin/env python3
import json

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# TS-008 test results
ts008_results = [
    {
        'scenario_id': 'TS-008-SC-001',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:35:00',
        'actual_results': 'Cannot test IP address creation with IO assignment. Form loads and Network dropdown works correctly (shows Corp-LAN and Guest-WiFi). However, Interface/Port dropdown is empty because no IOs exist (TS-007 blocked). Additionally, form sends io_id: null which causes API validation error "Expected string, received null" even though schema defines io_id as optional.',
        'notes': 'Blocked by TS-007 failure (no IOs available). Also discovered DEF-007: form sends null for optional io_id field instead of omitting it. Network dropdown works correctly.',
        'defect_id': 'DEF-007'
    },
    {
        'scenario_id': 'TS-008-SC-002',
        'status': 'FAILED',
        'execution_date': '2025-10-10T15:36:30',
        'actual_results': 'IP address format validation is MISSING. Entered invalid IP "999.999.999.999" in form and filled all other required fields. Form submitted to API without client-side validation. API returned 400 error but only complained about io_id field being null - NO ERROR about invalid IP format. API accepted the malformed IP address.',
        'notes': 'CRITICAL DEFECT: IP address format validation completely missing. Schema at src/lib/schemas/ip-address.ts line 13 only validates string length (min 1, max 50) but does NOT validate IP format. Should use z.ip() or regex pattern.',
        'defect_id': 'DEF-006'
    },
    {
        'scenario_id': 'TS-008-SC-003',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:37:00',
        'actual_results': 'Cannot test IP address uniqueness. Prerequisite IP creation (TS-008-SC-001) is blocked by missing IO requirement and DEF-007.',
        'notes': 'Blocked by DEF-006 and DEF-007. Cannot create first IP address to test uniqueness validation.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(ts008_results)

# Add defects
defect_006 = {
    'defect_id': 'DEF-006',
    'scenario_id': 'TS-008-SC-002',
    'severity': 'critical',
    'title': 'IP address format validation completely missing in API schema',
    'steps_to_reproduce': [
        'Navigate to /ip-addresses/new',
        'Enter invalid IP address: "999.999.999.999"',
        'Fill in Network: "Corp-LAN"',
        'Fill in DNS Name, Assignment Date, Notes',
        'Click "Create IP Address"',
        'Observe: No validation error about IP format'
    ],
    'expected_result': 'API should reject invalid IP address format with clear validation error message',
    'actual_result': 'API accepts any string 1-50 characters as IP address. Invalid IP "999.999.999.999" passed validation. Only error was about io_id being null.',
    'root_cause': 'CreateIPAddressSchema in src/lib/schemas/ip-address.ts line 13 uses z.string().min(1).max(50) without IP format validation. Missing .ip() validator or regex pattern for IPv4/IPv6 format.',
    'fix_required': 'Change line 13 from "ip_address: z.string().min(1).max(50)" to "ip_address: z.string().ip()" or use proper IPv4/IPv6 regex validation',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'This is a critical security and data integrity issue. System will allow garbage data in IP address fields. No client-side validation either.'
}

defect_007 = {
    'defect_id': 'DEF-007',
    'scenario_id': 'TS-008-SC-001',
    'severity': 'high',
    'title': 'IP address form sends null for optional io_id field instead of omitting it',
    'steps_to_reproduce': [
        'Navigate to /ip-addresses/new',
        'Fill in IP address, network, and other fields',
        'Leave Interface/Port as "Select Interface" (default)',
        'Click "Create IP Address"',
        'Observe API error: "Expected string, received null" for io_id'
    ],
    'expected_result': 'Form should omit optional io_id field when not selected, or send undefined. API schema defines io_id as optional.',
    'actual_result': 'Form sends io_id: null. Zod schema with .optional() rejects null values, causing validation error even though field is optional.',
    'root_cause': 'IP address form component sends null for unselected optional dropdowns. Zod .optional() means field can be omitted, NOT that it can be null. Schema needs .nullable() or form needs to omit field entirely.',
    'fix_required': 'Either: (1) Change form to omit io_id field when not selected instead of sending null, OR (2) Change schema line 11 to z.string().uuid().nullable().optional()',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'This affects user experience - users cannot create IP addresses without selecting an IO, even though io_id is designed to be optional (for IP reservations).'
}

uat_data['test_results']['defects'].extend([defect_006, defect_007])

# Update TS-008 summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-008':
        suite['test_summary'] = {
            'total_scenarios': 3,
            'scenarios_tested': 3,
            'passed': 0,
            'failed': 1,
            'blocked': 2,
            'pass_rate': '0%',
            'notes': 'Critical defect found: IP address format validation completely missing (DEF-006). Form also incorrectly sends null for optional io_id field (DEF-007). Network dropdown works correctly. Cannot complete testing due to missing IOs (TS-007 blocked).'
        }
        break

# Write back
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-008 test results")
print("Test Summary:")
print("  - Passed: 0")
print("  - Failed: 1")
print("  - Blocked: 2")
print("\nDefects:")
print("  - DEF-006: IP address format validation missing (CRITICAL)")
print("  - DEF-007: Form sends null for optional io_id field (HIGH)")
