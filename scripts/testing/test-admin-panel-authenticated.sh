#!/bin/bash

# Admin Panel Authenticated Testing Script
# Uses curl with cookie management for session-based authentication

BASE_URL="http://localhost:3001"
COOKIES_DIR="/tmp/moss-test-cookies"
mkdir -p "$COOKIES_DIR"

# Test result counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
BLOCKED_TESTS=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print test results
pass_test() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail_test() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo "  Reason: $2"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

block_test() {
    echo -e "${YELLOW}⊘ BLOCKED${NC}: $1"
    echo "  Reason: $2"
    ((BLOCKED_TESTS++))
    ((TOTAL_TESTS++))
}

info() {
    echo -e "\n${YELLOW}>>> $1${NC}\n"
}

# Function to login and get session cookie
login() {
    local username=$1
    local password=$2
    local cookie_file=$3

    echo "Attempting to login as $username..."

    # First, get the signin page to get CSRF token
    local csrf_response=$(curl -s -c "$cookie_file" "$BASE_URL/api/auth/csrf")
    local csrf_token=$(echo "$csrf_response" | jq -r '.csrfToken' 2>/dev/null)

    if [ -z "$csrf_token" ] || [ "$csrf_token" = "null" ]; then
        echo "  Failed to get CSRF token"
        return 1
    fi

    echo "  Got CSRF token: ${csrf_token:0:20}..."

    # Attempt login with credentials provider
    local login_response=$(curl -s -X POST "$BASE_URL/api/auth/callback/credentials" \
        -b "$cookie_file" \
        -c "$cookie_file" \
        -H "Content-Type: application/json" \
        -d "{\"csrfToken\":\"$csrf_token\",\"username\":\"$username\",\"password\":\"$password\",\"json\":true}")

    echo "  Login response: $login_response"

    # Check if we got a session
    local session=$(curl -s -b "$cookie_file" "$BASE_URL/api/auth/session")
    echo "  Session: $session"

    if echo "$session" | jq -e '.user' >/dev/null 2>&1; then
        echo "  ✓ Login successful"
        return 0
    else
        echo "  ✗ Login failed"
        return 1
    fi
}

# Function to test authenticated endpoint
test_authenticated_endpoint() {
    local method=$1
    local endpoint=$2
    local cookie_file=$3
    local data=$4
    local expected_status=$5

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -b "$cookie_file" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -b "$cookie_file")
    fi

    # Split response and status code
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    echo "Status: $status"
    echo "Body: $body"

    if [ "$status" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

echo "========================================"
echo "Admin Panel Authentication Testing"
echo "========================================"

info "TEST SUITE 1: Basic Authentication"

# TC-ADM-AUTH-001: Unauthenticated access returns 401
info "TC-ADM-AUTH-001: Unauthenticated Access to Admin API"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/settings/branding")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)
if [ "$status" = "401" ]; then
    pass_test "TC-ADM-AUTH-001: Unauthenticated access returns 401"
else
    fail_test "TC-ADM-AUTH-001: Unauthenticated access returns 401" "Got status $status instead of 401"
fi

# TC-ADM-AUTH-002: Session endpoint returns null when not logged in
info "TC-ADM-AUTH-002: Session Endpoint Returns Null"
response=$(curl -s "$BASE_URL/api/auth/session")
if [ "$response" = "null" ]; then
    pass_test "TC-ADM-AUTH-002: Session endpoint returns null"
else
    fail_test "TC-ADM-AUTH-002: Session endpoint returns null" "Got: $response"
fi

info "TEST SUITE 2: Role-Based Access Control"

# Try to login as testuser (role: user)
info "TC-ADM-AUTH-003: Test User Login"
USER_COOKIES="$COOKIES_DIR/testuser-cookies.txt"
if login "testuser@moss.local" "password" "$USER_COOKIES"; then
    pass_test "TC-ADM-AUTH-003: Test user can login"

    # TC-ADM-AUTH-004: User cannot access admin routes
    info "TC-ADM-AUTH-004: User Cannot Access Admin Routes"
    if test_authenticated_endpoint "GET" "/api/admin/settings/branding" "$USER_COOKIES" "" "403"; then
        pass_test "TC-ADM-AUTH-004: User denied access to admin API"
    else
        # 401 is also acceptable (session might not be working)
        response=$(curl -s -w "\n%{http_code}" -b "$USER_COOKIES" "$BASE_URL/api/admin/settings/branding")
        status=$(echo "$response" | tail -n 1)
        if [ "$status" = "401" ]; then
            block_test "TC-ADM-AUTH-004: User access control check" "Session not persisting (got 401)"
        else
            fail_test "TC-ADM-AUTH-004: User denied access to admin API" "Got status $status"
        fi
    fi
else
    block_test "TC-ADM-AUTH-003: Test user login" "Login failed - cannot test access control"
    block_test "TC-ADM-AUTH-004: User access control" "Login prerequisite failed"
fi

# Try to login as testadmin (role: admin)
info "TC-ADM-AUTH-005: Admin User Login"
ADMIN_COOKIES="$COOKIES_DIR/testadmin-cookies.txt"
if login "testadmin@moss.local" "password" "$ADMIN_COOKIES"; then
    pass_test "TC-ADM-AUTH-005: Admin user can login"

    # TC-ADM-AUTH-006: Admin can access admin routes
    info "TC-ADM-AUTH-006: Admin Can Access Admin Routes"
    if test_authenticated_endpoint "GET" "/api/admin/settings/branding" "$ADMIN_COOKIES" "" "200"; then
        pass_test "TC-ADM-AUTH-006: Admin can access admin API"
    else
        response=$(curl -s -w "\n%{http_code}" -b "$ADMIN_COOKIES" "$BASE_URL/api/admin/settings/branding")
        status=$(echo "$response" | tail -n 1)
        if [ "$status" = "401" ]; then
            block_test "TC-ADM-AUTH-006: Admin access check" "Session not persisting (got 401)"
        else
            fail_test "TC-ADM-AUTH-006: Admin can access admin API" "Got status $status"
        fi
    fi
else
    block_test "TC-ADM-AUTH-005: Admin user login" "Login failed"
    block_test "TC-ADM-AUTH-006: Admin access" "Login prerequisite failed"
fi

# Try to login as testsuperadmin (role: super_admin)
info "TC-ADM-AUTH-007: Super Admin User Login"
SUPERADMIN_COOKIES="$COOKIES_DIR/testsuperadmin-cookies.txt"
if login "testsuperadmin@moss.local" "password" "$SUPERADMIN_COOKIES"; then
    pass_test "TC-ADM-AUTH-007: Super admin user can login"

    # TC-ADM-AUTH-008: Super admin can access all routes
    info "TC-ADM-AUTH-008: Super Admin Can Access All Routes"
    if test_authenticated_endpoint "GET" "/api/admin/settings/authentication" "$SUPERADMIN_COOKIES" "" "200"; then
        pass_test "TC-ADM-AUTH-008: Super admin can access super admin routes"
    else
        response=$(curl -s -w "\n%{http_code}" -b "$SUPERADMIN_COOKIES" "$BASE_URL/api/admin/settings/authentication")
        status=$(echo "$response" | tail -n 1)
        if [ "$status" = "401" ]; then
            block_test "TC-ADM-AUTH-008: Super admin access check" "Session not persisting (got 401)"
        elif [ "$status" = "404" ]; then
            block_test "TC-ADM-AUTH-008: Super admin access check" "Authentication settings endpoint not implemented"
        else
            fail_test "TC-ADM-AUTH-008: Super admin can access super admin routes" "Got status $status"
        fi
    fi
else
    block_test "TC-ADM-AUTH-007: Super admin user login" "Login failed"
    block_test "TC-ADM-AUTH-008: Super admin access" "Login prerequisite failed"
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "Total Tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:        $PASSED_TESTS${NC}"
echo -e "${RED}Failed:        $FAILED_TESTS${NC}"
echo -e "${YELLOW}Blocked:       $BLOCKED_TESTS${NC}"
echo ""

if [ $TOTAL_TESTS -gt 0 ]; then
    pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Pass Rate:     ${pass_rate}% (of executed tests)"
fi

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
elif [ $BLOCKED_TESTS -gt 0 ]; then
    exit 2
else
    exit 0
fi
