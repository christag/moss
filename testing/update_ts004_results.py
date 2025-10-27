#!/usr/bin/env python3
import json

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# TS-004 test results
ts004_results = [
    {
        'scenario_id': 'TS-004-SC-001',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:23:00',
        'actual_results': 'Cannot test device creation. Device form loads but location dropdown fails with 400 error. API rejects limit=200 parameter (max is 100). Additionally, parent device dropdown fails with 500 error for same reason.',
        'notes': 'BLOCKED by multiple API issues. Cannot select location for device. See DEF-004 and DEF-005 for details. Also note: test expects "device_name" field but form has "Hostname" field. Test expects "rack_position" field but not visible on form. Test expects "Server Room A" but seeded rooms don\'t include it.',
        'defect_id': 'DEF-004,DEF-005'
    },
    {
        'scenario_id': 'TS-004-SC-002',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:23:30',
        'actual_results': 'Cannot test parent-child device relationship. Prerequisite device creation (TS-004-SC-001) is blocked.',
        'notes': 'Blocked by DEF-004 and DEF-005. Cannot create parent device to test relationship.'
    },
    {
        'scenario_id': 'TS-004-SC-003',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:24:00',
        'actual_results': 'Cannot test serial number uniqueness. Prerequisite device creation (TS-004-SC-001) is blocked.',
        'notes': 'Blocked by DEF-004 and DEF-005. Cannot create devices to test serial number validation.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(ts004_results)

# Add defects
defect_004 = {
    'defect_id': 'DEF-004',
    'scenario_id': 'TS-004-SC-001',
    'severity': 'critical',
    'title': 'Device form - Parent device dropdown fails with 500 error due to limit parameter',
    'steps_to_reproduce': [
        'Navigate to /devices/new',
        'Observe console error: GET /api/devices?device_type=chassis&limit=200&sort_by=hostname&sort_order=asc 500'
    ],
    'expected_result': 'Parent device dropdown should populate with chassis-type devices',
    'actual_result': '500 Internal Server Error. API schema rejects limit=200 (max is 100). ZodError: "Number must be less than or equal to 100"',
    'root_cause': 'Device form requests limit=200 but DeviceQuerySchema has max limit of 100. Forms need to request limit=100 instead.',
    'fix_required': 'Change device form to use limit=100 instead of limit=200 OR increase API schema max limit to 200+',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'This is a systemic issue affecting multiple forms. Locations API also has same limit=100 restriction causing widespread dropdown failures.'
}

defect_005 = {
    'defect_id': 'DEF-005',
    'scenario_id': 'TS-004-SC-001',
    'severity': 'critical',
    'title': 'Device form - Location dropdown fails with 400 error due to limit parameter',
    'steps_to_reproduce': [
        'Navigate to /devices/new',
        'Click on Location dropdown',
        'Observe console error: GET /api/locations?limit=200&sort_by=location_name&sort_order=asc 400'
    ],
    'expected_result': 'Location dropdown should populate with available locations',
    'actual_result': '400 Bad Request. API schema rejects limit=200 (max is 100). ZodError: "Number must be less than or equal to 100"',
    'root_cause': 'Device form requests limit=200 but LocationQuerySchema has max limit of 100. This is the ACTUAL root cause of DEF-003 - not sort_by parameter mismatch.',
    'fix_required': 'Change all forms to use limit=100 instead of limit=200 OR increase API schema max limits to 200+',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'DEF-003 should be updated - the real issue is limit=200, not sort_by=name. Room form also uses limit=200 causing same error. This affects device form, room form, and likely other forms loading location dropdowns.'
}

uat_data['test_results']['defects'].extend([defect_004, defect_005])

# Update DEF-003 with corrected root cause
for defect in uat_data['test_results']['defects']:
    if defect['defect_id'] == 'DEF-003':
        defect['root_cause'] = 'Room form requests limit=200 which exceeds LocationQuerySchema max limit of 100. Secondary issue: form uses sort_by=name but API expects sort_by=location_name (though this is masked by the limit error).'
        defect['fix_required'] = 'Change room form to use limit=100 instead of limit=200 AND change sort_by=name to sort_by=location_name'
        defect['additional_notes'] = 'Root cause analysis updated: Primary issue is limit=200 exceeding max. Secondary issue is sort_by parameter. See also DEF-005 which documents the same limit issue affecting other forms.'
        break

# Update TS-004 summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-004':
        suite['test_summary'] = {
            'total_scenarios': 3,
            'scenarios_tested': 3,
            'passed': 0,
            'failed': 0,
            'blocked': 3,
            'pass_rate': '0%',
            'notes': 'All device testing blocked by critical API bugs. Location dropdown fails due to limit parameter exceeding API max (DEF-005). Parent device dropdown fails for same reason (DEF-004). Cannot create devices until dropdown APIs are fixed.'
        }
        break

# Write back
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-004 test results")
print("Test Summary:")
print("  - Passed: 0")
print("  - Failed: 0")
print("  - Blocked: 3")
print("\nDefects:")
print("  - DEF-004: Parent device dropdown fails - limit=200 exceeds max (CRITICAL)")
print("  - DEF-005: Location dropdown fails - limit=200 exceeds max (CRITICAL)")
print("  - DEF-003: Updated root cause analysis - limit issue is primary cause")
