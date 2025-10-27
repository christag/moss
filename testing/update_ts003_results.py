#!/usr/bin/env python3
import json

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# TS-003 test results
ts003_results = [
    {
        'scenario_id': 'TS-003-SC-001',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:18:00',
        'actual_results': 'Successfully created "John Smith" with type Employee, department "IT", job title "IT Director", status Active. Person appears in list and detail page shows all correct information.',
        'notes': 'All expected results met. Person created successfully with all required fields.'
    },
    {
        'scenario_id': 'TS-003-SC-002',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:19:00',
        'actual_results': 'Successfully created "Jane Doe" with John Smith selected as manager. Detail page displays manager relationship as clickable link. Manager hierarchy correctly shown.',
        'notes': 'Manager relationship working correctly. Link to manager detail page functional. Organizational hierarchy displayed properly.'
    },
    {
        'scenario_id': 'TS-003-SC-003',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:20:00',
        'actual_results': 'Form validation prevented submission when email field contained "invalid-email-format". HTML5 validation tooltip appeared with message: "Please include an \'@\' in the email address. \'invalid-email-format\' is missing an \'@\'."',
        'notes': 'Email validation working correctly using HTML5 validation. User remained on create page as expected. Form did not submit.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(ts003_results)

# Update TS-003 summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-003':
        suite['test_summary'] = {
            'total_scenarios': 3,
            'scenarios_tested': 3,
            'passed': 3,
            'failed': 0,
            'blocked': 0,
            'pass_rate': '100%',
            'notes': 'All person CRUD operations working correctly. Manager hierarchy and email validation functioning as expected. No defects found.'
        }
        break

# Write back
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-003 test results")
print("Test Summary:")
print("  - Passed: 3")
print("  - Failed: 0")
print("  - Blocked: 0")
print("  - Pass Rate: 100%")
print("\nNo defects found in TS-003")
