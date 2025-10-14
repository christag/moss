# Device Duplicate Detection System

## Overview

The Device Duplicate Detection system helps identify and manage duplicate device entries that may arise from data imports, integrations, or manual entry. It uses a confidence-based matching algorithm to find potential duplicates.

## Matching Algorithm

### Confidence Levels

The system assigns confidence scores based on which identifiers match:

| Level | Score | Criteria | Use Case |
|-------|-------|----------|----------|
| **Definite** | 95-100% | Serial number OR asset tag match | These are almost certainly the same physical device |
| **High** | 80-94% | MAC address match (via interfaces) | Very likely the same device, but could be cloned/spoofed |
| **Medium** | 60-79% | Hostname + (Manufacturer OR Model) match | Likely the same device with renamed hostname |
| **Low** | 40-59% | Manufacturer + Model match only | Could be duplicates of similar equipment |

### Matching Rules

#### 1. Serial Number Matching (Definite - 100%)
- **Rule**: Serial numbers are unique to a device
- **Confidence**: 100%
- **Example**: Two "MacBook Pro" entries both with serial `C02XG0FDH7JY`
- **Action**: Almost always a duplicate - review immediately

#### 2. Asset Tag Matching (Definite - 100%)
- **Rule**: Asset tags are organization-assigned unique identifiers
- **Confidence**: 100%
- **Example**: Two devices both tagged `MB-2024-001`
- **Action**: Definite duplicate from your organization's tracking

#### 3. MAC Address Matching (High - 90%)
- **Rule**: MAC addresses are unique to network interfaces
- **Logic**: Checks both `devices.mac_address` and `device_interfaces.mac_address`
- **Confidence**: 90%
- **Example**: Two switches with same MAC address
- **Note**: Technically possible to spoof, but rare in normal operations

#### 4. Hostname + Manufacturer/Model (Medium - 65-75%)
- **Rule**: Same hostname with matching manufacturer or model
- **Confidence**: 65% (one match) or 75% (both match)
- **Example**: Two entries for hostname `prod-switch-01` both by "Cisco"
- **Use Case**: Common when importing from different systems with inconsistent naming

#### 5. Manufacturer + Model Only (Low - 45-55%)
- **Rule**: Same make/model but no unique identifiers
- **Confidence**: 45-55% (lower if hostnames differ)
- **Example**: Two "Cisco Catalyst 2960" switches with no serial numbers
- **Use Case**: Requires manual review - could legitimately be two identical devices

### Matching Logic

```typescript
// Priority order (highest to lowest):
1. Check serial_number → 100% match
2. Check asset_tag → 100% match
3. Check MAC address (interfaces) → 90% match
4. Check hostname + manufacturer/model → 65-75% match
5. Check manufacturer + model → 45-55% match

// Devices already matched at higher confidence are excluded from lower checks
```

## API Endpoints

### Get Duplicates for a Device

```http
GET /api/devices/{id}/duplicates
```

**Response:**
```json
{
  "success": true,
  "data": {
    "device_id": "uuid",
    "has_matches": true,
    "match_count": 2,
    "highest_confidence": 100,
    "matches": [
      {
        "device_id": "uuid",
        "hostname": "prod-switch-01",
        "manufacturer": "Cisco",
        "model": "Catalyst 2960",
        "serial_number": "ABC123",
        "asset_tag": null,
        "confidence": 100,
        "confidence_level": "definite",
        "matching_fields": ["serial_number"],
        "match_reason": "Serial number matches: ABC123"
      }
    ]
  }
}
```

### List All Devices with Duplicates

```http
GET /api/devices/duplicates
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_count": 5,
    "devices": [
      {
        "device_id": "uuid",
        "hostname": "prod-switch-01",
        "match_count": 2,
        "highest_confidence": 100
      }
    ]
  }
}
```

## User Interface

### Device Detail Page - Duplicates Tab

Each device detail page has a "Potential Duplicates" tab that:
- Shows all potential matches for that device
- Displays confidence levels with color-coded badges:
  - 🔴 **Red**: Definite (95-100%)
  - 🟠 **Orange**: High (80-94%)
  - 🟡 **Yellow**: Medium (60-79%)
  - ⚪ **Gray**: Low (40-59%)
- Highlights matching fields (e.g., serial number gets ⚠ icon)
- Allows viewing or deleting duplicate devices

### Duplicates Dashboard

Navigate to `/devices/duplicates` to see:
- All devices with potential duplicates
- Confidence level for each device's highest match
- Quick access to review each device's duplicates

## Workflow for Data Integration

### Scenario: Importing from Multiple Systems

1. **Before Import**
   - Export data from all systems
   - Review for obvious duplicates manually

2. **During Import**
   - Import all data (duplicates will be created)
   - System automatically detects potential matches

3. **After Import**
   - Navigate to `/devices/duplicates` dashboard
   - Review devices by confidence level (start with "Definite")

4. **Resolution**
   - **Definite/High Matches**: Delete the duplicate with less complete information
   - **Medium Matches**: Verify hostname history, then delete duplicate
   - **Low Matches**: Manually verify if they're truly the same device

### Best Practices

1. **Use Unique Identifiers**: Always collect serial numbers and asset tags when possible
2. **Standardize Hostnames**: Use consistent naming conventions across systems
3. **MAC Address Tracking**: Track MAC addresses for network devices
4. **Regular Audits**: Review duplicates dashboard monthly
5. **Pre-Import Cleanup**: Deduplicate source systems before importing

## Limitations & Future Improvements

### Current Limitations

1. **No Auto-Merge**: MVP only supports manual deletion
2. **No History Tracking**: Doesn't track which device was the "source of truth"
3. **Single-Device View**: Must review each device individually
4. **No Bulk Operations**: Can't delete multiple duplicates at once

### Future Enhancements

1. **Smart Merge**: Automatically merge device records, keeping most complete data
2. **Merge Preview**: Show side-by-side comparison before merging
3. **Merge History**: Track when devices were merged and by whom
4. **Bulk Actions**: Select and delete/merge multiple duplicates
5. **Import Warnings**: Flag potential duplicates during import process
6. **Confidence Tuning**: Allow admins to adjust confidence thresholds
7. **Custom Rules**: Add organization-specific matching rules
8. **Interface Matching**: More sophisticated MAC address matching across interfaces

## Technical Implementation

### Core Service

**File**: `src/lib/deviceMatching.ts`

Key functions:
- `findPotentialDuplicates(deviceId)` - Find matches for one device
- `findAllDevicesWithDuplicates()` - Find all devices with matches

### Database Queries

The system uses PostgreSQL queries to efficiently match devices:

```sql
-- Serial number matching
SELECT * FROM devices 
WHERE serial_number = $1 
  AND id != $2
  AND serial_number IS NOT NULL;

-- MAC address matching (via interfaces)
SELECT DISTINCT d.* 
FROM devices d
INNER JOIN device_interfaces di ON d.id = di.device_id
WHERE di.mac_address = $1 AND d.id != $2;

-- Hostname + Model matching
SELECT * FROM devices
WHERE hostname = $1 
  AND manufacturer = $2 
  AND id != $3;
```

### Performance Considerations

- Queries are optimized with proper indexes on:
  - `serial_number`
  - `asset_tag`
  - `mac_address`
  - `hostname`
  - `manufacturer` + `model` (composite)
- Results are cached per request
- Dashboard query runs all checks but only shows matches ≥60% confidence

## Troubleshooting

### "No Duplicates Found" but I Know There Are Some

**Possible Causes:**
1. Serial numbers/asset tags have different formatting (e.g., spaces, dashes)
2. MAC addresses in different formats (e.g., `00:1A:2B:3C:4D:5E` vs `001a2b3c4d5e`)
3. Confidence is below 60% threshold
4. Fields are NULL in database

**Solutions:**
- Standardize data formats before import
- Manually search for device
- Lower confidence threshold (future feature)

### Getting Too Many Low-Confidence Matches

**Solution:**
- Low-confidence matches (< 60%) are filtered out of the dashboard
- These typically require manual review
- Consider adding serial numbers/asset tags to reduce false positives

## Migration from Other Systems

When migrating from systems like:
- **ServiceNow**: Export CMDB with serial numbers
- **Lansweeper**: Include MAC addresses and asset tags
- **Excel/CSV**: Ensure consistent column naming

See the [Import Guide](./IMPORT-GUIDE.md) for detailed instructions.

