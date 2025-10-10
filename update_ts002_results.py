#!/usr/bin/env python3
import json

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# TS-002 test results
ts002_results = [
    {
        'scenario_id': 'TS-002-SC-001',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:15:28',
        'actual_results': 'Successfully created "Acme HQ" location linked to "Acme Corporation" with type "Office" and address "123 Main St, San Francisco, CA 94102". Location appears in list with correct data.',
        'notes': 'Location created successfully. Note: Had to explicitly select "Office" from dropdown to trigger proper validation. All expected results met.'
    },
    {
        'scenario_id': 'TS-002-SC-002',
        'status': 'PARTIAL',
        'execution_date': '2025-10-10T15:16:00',
        'actual_results': 'Location detail page displays correctly with name, type, and address. However, company relationship (Acme Corporation) is NOT shown on the detail page.',
        'notes': 'UI GAP: Company field missing from location detail page. Test expects "Company field shows Acme Corporation (clickable link if implemented)" but no company information is displayed. See DEF-002.',
        'defect_id': 'DEF-002'
    },
    {
        'scenario_id': 'TS-002-SC-003',
        'status': 'FAILED',
        'execution_date': '2025-10-10T15:17:00',
        'actual_results': 'Cannot create room. Location dropdown fails to load with 400 Bad Request error. API endpoint /api/locations?limit=200&sort_by=name returns 400 because it expects sort_by=location_name, not sort_by=name.',
        'notes': 'CRITICAL BUG: API parameter mismatch in room form. Form tries to load locations with sort_by=name but API expects sort_by=location_name. See DEF-003.',
        'defect_id': 'DEF-003'
    },
    {
        'scenario_id': 'TS-002-SC-004',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:17:30',
        'actual_results': 'Cannot test. Prerequisite room creation (TS-002-SC-003) failed.',
        'notes': 'Blocked by DEF-003. Cannot create rooms to test location deletion with dependencies.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(ts002_results)

# Add defects
defect_002 = {
    'defect_id': 'DEF-002',
    'scenario_id': 'TS-002-SC-002',
    'severity': 'medium',
    'title': 'Company relationship not displayed on location detail page',
    'steps_to_reproduce': [
        'Create location linked to a company',
        'Navigate to location detail page',
        'Observe company field is missing'
    ],
    'expected_result': 'Detail page should display company field showing "Acme Corporation" with clickable link to company detail',
    'actual_result': 'Company field is not shown anywhere on the location detail page',
    'root_cause': 'UI implementation gap - location detail page does not fetch or display company relationship',
    'fix_required': 'Add company field to location detail page showing company name with link',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'While location IS linked to company in database (form has company dropdown), the relationship is not shown on detail view'
}

defect_003 = {
    'defect_id': 'DEF-003',
    'scenario_id': 'TS-002-SC-003',
    'severity': 'critical',
    'title': 'Room creation fails - location dropdown returns 400 error',
    'steps_to_reproduce': [
        'Navigate to /rooms/new',
        'Attempt to select a location from dropdown',
        'Observe console error: GET /api/locations?limit=200&sort_by=name 400'
    ],
    'expected_result': 'Location dropdown should populate with available locations',
    'actual_result': '400 Bad Request. API expects sort_by=location_name but form sends sort_by=name',
    'root_cause': 'API parameter mismatch between room form and locations API endpoint',
    'fix_required': 'Change room form to use sort_by=location_name instead of sort_by=name OR update locations API to accept sort_by=name as alias',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'This blocks all room creation and testing of room-related scenarios. Same issue may exist in other forms that load locations dropdown (e.g., device form shows same error).'
}

uat_data['test_results']['defects'].extend([defect_002, defect_003])

# Update TS-002 summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-002':
        suite['test_summary'] = {
            'total_scenarios': 4,
            'scenarios_tested': 4,
            'passed': 1,
            'partial': 1,
            'failed': 1,
            'blocked': 1,
            'pass_rate': '25%',
            'notes': 'Location CRUD works but has UI gaps and critical API bugs. Company relationship not shown on detail page (DEF-002). Room creation completely broken due to API parameter mismatch (DEF-003).'
        }
        break

# Write back
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-002 test results")
print("Test Summary:")
print("  - Passed: 1")
print("  - Partial: 1 (DEF-002)")
print("  - Failed: 1 (DEF-003)")
print("  - Blocked: 1")
print("\nDefects:")
print("  - DEF-002: Company field missing from location detail (MEDIUM)")
print("  - DEF-003: Room creation broken - API parameter mismatch (CRITICAL)")
