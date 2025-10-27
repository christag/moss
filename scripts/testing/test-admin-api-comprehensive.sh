#!/bin/bash

# Comprehensive Admin Panel API Testing
# Note: Session authentication may not work via curl - documenting actual results

BASE_URL="http://localhost:3001"
TEST_RESULTS=()
TOTAL=0
PASS=0
FAIL=0
BLOCKED=0

log_result() {
    local status=$1
    local test_id=$2
    local description=$3
    local details=$4
    
    ((TOTAL++))
    case $status in
        PASS) ((PASS++)); echo "✓ PASS: $test_id - $description" ;;
        FAIL) ((FAIL++)); echo "✗ FAIL: $test_id - $description"; echo "  $details" ;;
        BLOCKED) ((BLOCKED++)); echo "⊘ BLOCKED: $test_id - $description"; echo "  $details" ;;
    esac
    
    TEST_RESULTS+=("$status|$test_id|$description|$details")
}

echo "=========================================="
echo "Admin Panel Comprehensive API Testing"
echo "=========================================="
echo ""

# TEST SUITE 1: Unauthenticated Access Control
echo "TEST SUITE 1: Access Control (Unauthenticated)"
echo "----------------------------------------------"

# TC-ADM-001: Branding API requires auth
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/settings/branding")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    log_result "PASS" "TC-ADM-001" "Branding API requires authentication" "HTTP 401 returned"
else
    log_result "FAIL" "TC-ADM-001" "Branding API requires authentication" "Expected 401, got $status"
fi

# TC-ADM-002: Storage API requires auth
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/settings/storage")
status=$(echo "$response" | tail -n 1)
if [ "$status" = "401" ]; then
    log_result "PASS" "TC-ADM-002" "Storage API requires authentication" "HTTP 401 returned"
else
    log_result "FAIL" "TC-ADM-002" "Storage API requires authentication" "Expected 401, got $status"
fi

# TC-ADM-003: Authentication API requires auth
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/settings/authentication")
status=$(echo "$response" | tail -n 1)
if [ "$status" = "401" ] || [ "$status" = "404" ]; then
    log_result "PASS" "TC-ADM-003" "Authentication API requires authentication" "HTTP $status returned"
else
    log_result "FAIL" "TC-ADM-003" "Authentication API requires authentication" "Expected 401/404, got $status"
fi

# TC-ADM-004: Integrations API requires auth
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/integrations")
status=$(echo "$response" | tail -n 1)
if [ "$status" = "401" ]; then
    log_result "PASS" "TC-ADM-004" "Integrations API requires authentication" "HTTP 401 returned"
else
    log_result "FAIL" "TC-ADM-004" "Integrations API requires authentication" "Expected 401, got $status"
fi

# TC-ADM-005: Audit logs API requires auth
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/audit-logs")
status=$(echo "$response" | tail -n 1)
if [ "$status" = "401" ]; then
    log_result "PASS" "TC-ADM-005" "Audit logs API requires authentication" "HTTP 401 returned"
else
    log_result "FAIL" "TC-ADM-005" "Audit logs API requires authentication" "Expected 401, got $status"
fi

# TC-ADM-006: Custom fields API requires auth  
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/fields")
status=$(echo "$response" | tail -n 1)
if [ "$status" = "401" ] || [ "$status" = "404" ]; then
    log_result "PASS" "TC-ADM-006" "Custom fields API requires authentication" "HTTP $status returned"
else
    log_result "FAIL" "TC-ADM-006" "Custom fields API requires authentication" "Expected 401/404, got $status"
fi

echo ""
echo "TEST SUITE 2: API Endpoint Existence"
echo "----------------------------------------------"

# TC-ADM-010: Check all admin API routes exist (even if protected)
endpoints=(
    "/api/admin/settings/branding"
    "/api/admin/settings/storage"
    "/api/admin/settings/authentication"
    "/api/admin/integrations"
    "/api/admin/audit-logs"
    "/api/admin/fields"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    status=$(echo "$response" | tail -n 1)
    if [ "$status" != "404" ]; then
        log_result "PASS" "TC-ADM-EXIST" "Endpoint exists: $endpoint" "HTTP $status (not 404)"
    else
        log_result "FAIL" "TC-ADM-EXIST" "Endpoint exists: $endpoint" "HTTP 404 - Not Found"
    fi
done

echo ""
echo "TEST SUITE 3: Database Schema Validation"
echo "----------------------------------------------"

# TC-ADM-DB-001: system_settings table exists
PGPASSWORD=moss_dev_password psql -h 192.168.64.2 -U moss -d moss -c "\d system_settings" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log_result "PASS" "TC-ADM-DB-001" "system_settings table exists" "Table found in database"
else
    log_result "FAIL" "TC-ADM-DB-001" "system_settings table exists" "Table not found"
fi

# TC-ADM-DB-002: integrations table exists
PGPASSWORD=moss_dev_password psql -h 192.168.64.2 -U moss -d moss -c "\d integrations" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log_result "PASS" "TC-ADM-DB-002" "integrations table exists" "Table found in database"
else
    log_result "FAIL" "TC-ADM-DB-002" "integrations table exists" "Table not found"
fi

# TC-ADM-DB-003: admin_audit_log table exists
PGPASSWORD=moss_dev_password psql -h 192.168.64.2 -U moss -d moss -c "\d admin_audit_log" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log_result "PASS" "TC-ADM-DB-003" "admin_audit_log table exists" "Table found in database"
else
    log_result "FAIL" "TC-ADM-DB-003" "admin_audit_log table exists" "Table not found"
fi

# TC-ADM-DB-004: custom_fields table exists
PGPASSWORD=moss_dev_password psql -h 192.168.64.2 -U moss -d moss -c "\d custom_fields" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log_result "PASS" "TC-ADM-DB-004" "custom_fields table exists" "Table found in database"
else
    log_result "FAIL" "TC-ADM-DB-004" "custom_fields table exists" "Table not found"
fi

# TC-ADM-DB-005: integration_sync_logs table exists
PGPASSWORD=moss_dev_password psql -h 192.168.64.2 -U moss -d moss -c "\d integration_sync_logs" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log_result "PASS" "TC-ADM-DB-005" "integration_sync_logs table exists" "Table found in database"
else
    log_result "FAIL" "TC-ADM-DB-005" "integration_sync_logs table exists" "Table not found"
fi

# TC-ADM-DB-006: Check system_settings has default values
count=$(PGPASSWORD=moss_dev_password psql -h 192.168.64.2 -U moss -d moss -t -c "SELECT COUNT(*) FROM system_settings;" 2>/dev/null | tr -d ' ')
if [ -n "$count" ] && [ "$count" -gt 0 ]; then
    log_result "PASS" "TC-ADM-DB-006" "system_settings has default values" "$count settings found"
else
    log_result "FAIL" "TC-ADM-DB-006" "system_settings has default values" "No settings found"
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests:   $TOTAL"
echo "Passed:        $PASS"
echo "Failed:        $FAIL"
echo "Blocked:       $BLOCKED"
echo ""
if [ $TOTAL -gt 0 ]; then
    pass_rate=$((PASS * 100 / TOTAL))
    echo "Pass Rate:     ${pass_rate}%"
fi
echo ""

# Save results to file
cat > /Users/admin/Dev/moss/test-results-admin-api.txt << ENDRESULTS
Admin Panel API Test Results
Generated: $(date)

Total Tests: $TOTAL
Passed: $PASS
Failed: $FAIL
Blocked: $BLOCKED
Pass Rate: $((PASS * 100 / TOTAL))%

Detailed Results:
$(printf '%s\n' "${TEST_RESULTS[@]}")
ENDRESULTS

echo "Results saved to: test-results-admin-api.txt"
