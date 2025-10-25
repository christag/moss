#!/usr/bin/env python3
import json

# Read the UAT.json file
with open('/Users/admin/Dev/moss/UAT.json', 'r') as f:
    uat_data = json.load(f)

# TS-009 test results
ts009_results = [
    {
        'scenario_id': 'TS-009-SC-001',
        'status': 'FAILED',
        'execution_date': '2025-10-10T15:42:00',
        'actual_results': 'Test plan references non-existent fields. Test expects: authentication_type (sso_saml), vendor_name (Slack Technologies), service_tier (Plus). Actual form has: service_name, software dropdown, environment, status, criticality, service_url, subscription dates, seat_count, cost, scim_enabled, api_access_enabled, notes. Filled in: service_name="Slack", service_url="https://acme.slack.com", criticality="High", seat_count=50, scim_enabled=checked, notes="Company-wide collaboration tool with SSO". Form submission FAILED with 13 validation errors - all complaining "Expected string, received null" for optional fields (software_id, company_id, business_owner_id, technical_contact_id, account_id, subscription dates, cost, billing_frequency, sso_provider, sso_protocol, provisioning_type, api_documentation_url).',
        'notes': 'UAT test plan is outdated. Test references authentication_type, vendor_name, service_tier fields that do not exist in form or schema. Form blocked by DEF-007 (systemic null fields issue). Schema has sso_provider and sso_protocol fields but they are not in form UI.',
        'defect_id': 'DEF-007,DEF-008'
    },
    {
        'scenario_id': 'TS-009-SC-002',
        'status': 'BLOCKED',
        'execution_date': '2025-10-10T15:43:00',
        'actual_results': 'Cannot test multiple authentication types. Prerequisite service creation (TS-009-SC-001) is blocked by null fields validation error (DEF-007). Additionally, test plan references authentication_type field with values (username_password, oauth, api_key, sso_oidc) that do not exist in the schema or form.',
        'notes': 'Blocked by DEF-007. Test plan appears outdated - authentication_type field does not exist. Actual schema has sso_provider and sso_protocol but no authentication_type enum.'
    }
]

# Add test results
uat_data['test_results']['scenarios_tested'].extend(ts009_results)

# Add new defect
defect_008 = {
    'defect_id': 'DEF-008',
    'scenario_id': 'TS-009-SC-001',
    'severity': 'medium',
    'title': 'SaaS Service form missing SSO authentication fields',
    'steps_to_reproduce': [
        'Navigate to /saas-services/new',
        'Observe form fields available',
        'Compare to database schema in dbsetup.sql (sso_provider, sso_protocol columns)',
        'Note: Schema has sso_provider and sso_protocol but form UI does not expose them'
    ],
    'expected_result': 'Form should have fields for SSO authentication details (sso_provider, sso_protocol) to match database schema',
    'actual_result': 'Form is missing sso_provider and sso_protocol fields. Users cannot specify SSO authentication type even though database supports it and SCIM checkbox exists.',
    'root_cause': 'SaaS Service form component incomplete. Database schema has sso_provider and sso_protocol fields, Zod validation schema includes them (lines 28-29 in saas-service.ts), but form UI does not expose these fields to users.',
    'fix_required': 'Add SSO authentication fields to SaaS Service form: (1) sso_provider dropdown (e.g., Okta, Azure AD, Google, OneLogin), (2) sso_protocol dropdown (e.g., SAML, OIDC)',
    'browser_version': 'Playwright/Chrome',
    'additional_notes': 'SCIM checkbox exists but SSO fields are missing, which is inconsistent since SCIM typically requires SSO. Also note: UAT test plan is outdated and references authentication_type field that does not exist in schema.'
}

uat_data['test_results']['defects'].append(defect_008)

# Update DEF-007 to reflect systemic nature
for defect in uat_data['test_results']['defects']:
    if defect['defect_id'] == 'DEF-007':
        defect['title'] = 'Forms send null for optional fields instead of omitting them (SYSTEMIC ISSUE)'
        defect['severity'] = 'critical'  # Upgraded from high to critical due to systemic nature
        defect['additional_notes'] = 'This is a SYSTEMIC issue affecting multiple forms throughout the application. Affects: IP Address form (io_id and other optionals), SaaS Service form (13 optional fields including software_id, company_id, business_owner_id, technical_contact_id, account_id, subscription dates, cost, billing_frequency, sso_provider, sso_protocol, provisioning_type, api_documentation_url), and likely other forms. Root cause: All create forms send null for empty optional fields, but Zod schemas with .optional() reject null (they only accept omitted fields). Update schemas consistently use .nullable().optional() which works correctly. Fix: Either (1) Change all forms to omit optional fields when empty, OR (2) Change all Create schemas to use .nullable().optional() pattern like Update schemas.'
        break

# Update TS-009 summary
for suite in uat_data['test_suites']:
    if suite['suite_id'] == 'TS-009':
        suite['test_summary'] = {
            'total_scenarios': 2,
            'scenarios_tested': 2,
            'passed': 0,
            'failed': 1,
            'blocked': 1,
            'pass_rate': '0%',
            'notes': 'UAT test plan is outdated - references fields that do not exist (authentication_type, vendor_name, service_tier). SaaS service creation blocked by DEF-007 (systemic null fields issue affecting 13 optional fields). Form also missing SSO fields (sso_provider, sso_protocol) that exist in schema (DEF-008). Software dropdown exists but relationship fields not tested due to blocking issue.'
        }
        break

# Write back
with open('/Users/admin/Dev/moss/UAT.json', 'w') as f:
    json.dump(uat_data, f, indent=2)

print("UAT.json updated with TS-009 test results")
print("Test Summary:")
print("  - Passed: 0")
print("  - Failed: 1")
print("  - Blocked: 1")
print("\nDefects:")
print("  - DEF-007: Forms send null for optional fields - SYSTEMIC ISSUE (upgraded to CRITICAL)")
print("  - DEF-008: SaaS Service form missing SSO authentication fields (MEDIUM)")
print("\nNote: UAT test plan appears outdated - references non-existent fields")
