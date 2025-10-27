#!/bin/bash
# Load test script for creating 1000 devices via API
# Agent 4 - Database & Performance Testing

COMPANY_ID="00000000-0000-0000-0000-000000000002"
API_BASE="http://localhost:3001/api"
TOTAL_DEVICES=1000

echo "Starting load test: Creating $TOTAL_DEVICES devices..."
echo "Start time: $(date)"

SUCCESS_COUNT=0
FAIL_COUNT=0

for i in $(seq 1 $TOTAL_DEVICES); do
  RESPONSE=$(curl -s -X POST "$API_BASE/devices" \
    -H "Content-Type: application/json" \
    -d "{\"hostname\":\"load-test-device-$i\",\"company_id\":\"$COMPANY_ID\",\"status\":\"active\"}")

  if echo "$RESPONSE" | grep -q '"success":true'; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  # Progress indicator every 100 devices
  if [ $((i % 100)) -eq 0 ]; then
    echo "Progress: $i/$TOTAL_DEVICES devices created (Success: $SUCCESS_COUNT, Failed: $FAIL_COUNT)"
  fi
done

echo "Load test complete!"
echo "End time: $(date)"
echo "Total created: $SUCCESS_COUNT"
echo "Total failed: $FAIL_COUNT"
