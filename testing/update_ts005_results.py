#!/usr/bin/env python3
import json

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# TS-005 test results
ts005_results = [
    {
        'scenario_id': 'TS-005-SC-001',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:24:00',
        'actual_results': 'Successfully created "IT-Admins" group with type "Active Directory", external ID "CN=IT-Admins,OU=Groups,DC=acme,DC=com", and description. Group appears in list with all correct information.',
        'notes': 'All expected results met. Group created successfully with Active Directory type and external ID for sync reference.'
    },
    {
        'scenario_id': 'TS-005-SC-002',
        'status': 'PASSED',
        'execution_date': '2025-10-10T15:26:00',
        'actual_results': 'Successfully created 4 groups: Okta-IT (Okta), MacBooks-Sales (Jamf Smart Group), Intune-Mobile (Intune), VIP-Users (Custom). All groups appear in list with correct types. Filter by type works correctly - selecting "Okta" shows only Okta-IT. Detail pages display types correctly.',
        'notes': 'All expected results met. Multiple group types working correctly. Type filter functional. All detail pages showing correct information.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(ts005_results)

# Update TS-005 summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-005':
        suite['test_summary'] = {
            'total_scenarios': 2,
            'scenarios_tested': 2,
            'passed': 2,
            'failed': 0,
            'blocked': 0,
            'pass_rate': '100%',
            'notes': 'Groups CRUD operations working correctly. All group types (AD, Okta, Jamf, Intune, Custom) can be created. Type filtering functional. No defects found.'
        }
        break

# Write back
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-005 test results")
print("Test Summary:")
print("  - Passed: 2")
print("  - Failed: 0")
print("  - Blocked: 0")
print("  - Pass Rate: 100%")
print("\nNo defects found in TS-005")
