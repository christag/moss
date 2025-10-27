#!/usr/bin/env python3
import json
from datetime import datetime

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# Add test_results section if not exists
if 'test_results' not in uat_data:
    uat_data['test_results'] = {
        'execution_date': datetime.now().isoformat(),
        'tester': 'Claude Code (Automated Testing)',
        'test_environment': 'http://localhost:3001',
        'scenarios_tested': [],
        'defects': []
    }

# Test results for TS-001
test_results = [
    {
        'scenario_id': 'TS-001-SC-001',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:08:00',
        'actual_results': 'Successfully created Acme Corporation with type Customer. Form submitted, redirected to company detail page. All data saved correctly including website https://acme.example.com and notes.',
        'notes': 'All expected results met. Company visible in list and detail page shows all correct information.'
    },
    {
        'scenario_id': 'TS-001-SC-002',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:09:00',
        'actual_results': 'Form validation prevented submission when company_name field was left empty. HTML5 validation tooltip appeared with message "Please fill out this field".',
        'notes': 'Validation working correctly. User remained on create page as expected.'
    },
    {
        'scenario_id': 'TS-001-SC-003',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:09:30',
        'actual_results': 'Detail page loaded at /companies/[id] with correct breadcrumb "Companies / Acme Corporation". All fields displayed correctly including timestamps (Created: 3:08:07 PM, Last Updated: 3:08:07 PM). Edit Company button visible.',
        'notes': 'All expected results met. Page layout and information display working correctly.'
    },
    {
        'scenario_id': 'TS-001-SC-004',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:10:00',
        'actual_results': 'Successfully updated website to https://acme-updated.example.com and notes to "Updated: Primary customer for all IT equipment". Updated_at timestamp changed from 3:08:07 PM to 3:10:03 PM. Company name remained unchanged.',
        'notes': 'Update operation working correctly. Unchanged fields preserved, updated fields saved, timestamp refreshed.'
    },
    {
        'scenario_id': 'TS-001-SC-005',
        'status': 'FAILED',
        'execution_date': '2025-10-10T15:11:00',
        'actual_results': 'Created "DeleteMe Inc" successfully. Clicked delete button, confirmation dialog appeared. After confirmation, received 500 Internal Server Error. Company was NOT deleted and remains in the list.',
        'notes': 'CRITICAL BUG: DELETE API endpoint fails with database error. See DEF-001 for details.',
        'defect_id': 'DEF-001'
    },
    {
        'scenario_id': 'TS-001-SC-006',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:12:00',
        'actual_results': 'Cannot test this scenario because basic delete functionality (TS-001-SC-005) is broken.',
        'notes': 'Blocked by DEF-001. Will test after delete bug is fixed.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(test_results)

# Add defect for TS-001-SC-005
defect_001 = {
    'defect_id': 'DEF-001',
    'scenario_id': 'TS-001-SC-005',
    'severity': 'critical',
    'title': 'Company deletion fails with 500 Internal Server Error',
    'steps_to_reproduce': [
        'Create a company (e.g., "DeleteMe Inc")',
        'Navigate to /companies',
        'Click delete button for the company',
        'Confirm deletion in dialog'
    ],
    'expected_result': 'Company should be deleted and removed from the list with success message',
    'actual_result': '500 Internal Server Error: error: column "publisher_id" does not exist. Company remains in database and list.',
    'root_cause': 'Database schema mismatch in /src/app/api/companies/[id]/route.ts line 226. DELETE endpoint references non-existent publisher_id column.',
    'fix_required': 'Remove reference to publisher_id column from DELETE query or add column to companies table schema',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'This blocks testing of TS-001-SC-006 (delete with dependencies). All company deletion functionality is broken until fixed.'
}

uat_data['test_results']['defects'].append(defect_001)

# Update test suite summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-001':
        suite['test_summary'] = {
            'total_scenarios': 6,
            'scenarios_tested': 6,
            'passed': 4,
            'failed': 1,
            'blocked': 1,
            'pass_rate': '66.7%',
            'notes': 'Basic CRUD operations mostly working. Critical bug in delete functionality (DEF-001) prevents completion of delete scenarios.'
        }
        break

# Write back to file
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-001 test results")
print("Test Summary:")
print("  - Passed: 4")
print("  - Failed: 1 (DEF-001)")
print("  - Blocked: 1")
print("\nDefects:")
print("  - DEF-001: Company deletion fails with 500 error (CRITICAL)")
