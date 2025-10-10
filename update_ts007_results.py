#!/usr/bin/env python3
import json

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# TS-007 test results
ts007_results = [
    {
        'scenario_id': 'TS-007-SC-001',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:30:00',
        'actual_results': 'Cannot test IO creation. IO form loads but Device dropdown fails with 400 error (same as DEF-005). Cannot select device for IO.',
        'notes': 'BLOCKED by DEF-005. Device dropdown uses limit=200 which exceeds API max. Also blocked by TS-004 failure - no devices exist to select.',
        'defect_id': 'DEF-005'
    },
    {
        'scenario_id': 'TS-007-SC-002',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:30:15',
        'actual_results': 'Cannot test IO with VLAN assignment. Prerequisite IO creation (TS-007-SC-001) is blocked.',
        'notes': 'Blocked by DEF-005. Cannot create IOs without functional device dropdown.'
    },
    {
        'scenario_id': 'TS-007-SC-003',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:30:30',
        'actual_results': 'Cannot test IO-to-IO topology connections. Prerequisite IO creation (TS-007-SC-001) is blocked.',
        'notes': 'Blocked by DEF-005. Cannot create IOs to connect.'
    },
    {
        'scenario_id': 'TS-007-SC-004',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:30:45',
        'actual_results': 'Cannot test multiple interface types. Prerequisite IO creation (TS-007-SC-001) is blocked.',
        'notes': 'Blocked by DEF-005. Cannot create IOs of any type without functional device dropdown.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(ts007_results)

# Update TS-007 summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-007':
        suite['test_summary'] = {
            'total_scenarios': 4,
            'scenarios_tested': 4,
            'passed': 0,
            'failed': 0,
            'blocked': 4,
            'pass_rate': '0%',
            'notes': 'All IO testing blocked by DEF-005. Device dropdown in IO form fails with same API limit issue as device form. Cannot create IOs without ability to select devices. Note: Network dropdown works correctly (Corp-LAN and Guest-WiFi populated).'
        }
        break

# Write back
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-007 test results")
print("Test Summary:")
print("  - Passed: 0")
print("  - Failed: 0")
print("  - Blocked: 4")
print("\nAll scenarios blocked by DEF-005 (device dropdown API limit issue)")
