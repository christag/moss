#!/usr/bin/env ts-node
/**
 * Foreign Key Relationship Test Script
 * Tests ON DELETE CASCADE and ON DELETE SET NULL behaviors across all tables
 *
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-foreign-keys.ts
 */

import { transaction, closePool } from '../src/lib/db'
import { PoolClient } from 'pg'

interface TestResult {
  testName: string
  passed: boolean
  error?: string
  details?: string
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, details?: string, error?: string) {
  results.push({ testName: name, passed, details, error })
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status}: ${name}`)
  if (details) console.log(`  Details: ${details}`)
  if (error) console.log(`  Error: ${error}`)
}

/**
 * Test ON DELETE CASCADE: location → rooms
 * When a location is deleted, all rooms in that location should be deleted
 */
async function testLocationRoomsCascade(client: PoolClient): Promise<void> {
  try {
    // Create test location
    const locResult = await client.query(
      `INSERT INTO locations (location_name, location_type)
       VALUES ('Test Location CASCADE', 'office')
       RETURNING id`
    )
    const locationId = locResult.rows[0].id

    // Create test rooms
    await client.query(
      `INSERT INTO rooms (location_id, room_name, room_type)
       VALUES ($1, 'Test Room 1', 'office'), ($1, 'Test Room 2', 'server_room')`,
      [locationId]
    )

    // Verify rooms exist
    const roomsBefore = await client.query('SELECT COUNT(*) FROM rooms WHERE location_id = $1', [locationId])
    const roomCountBefore = parseInt(roomsBefore.rows[0].count)

    if (roomCountBefore !== 2) {
      throw new Error(`Expected 2 rooms, found ${roomCountBefore}`)
    }

    // Delete location
    await client.query('DELETE FROM locations WHERE id = $1', [locationId])

    // Verify rooms were cascaded
    const roomsAfter = await client.query('SELECT COUNT(*) FROM rooms WHERE location_id = $1', [locationId])
    const roomCountAfter = parseInt(roomsAfter.rows[0].count)

    logTest(
      'CASCADE: location → rooms',
      roomCountAfter === 0,
      `Created 2 rooms, after delete: ${roomCountAfter} rooms`
    )
  } catch (error) {
    logTest('CASCADE: location → rooms', false, undefined, String(error))
  }
}

/**
 * Test ON DELETE CASCADE: device → ios
 * When a device is deleted, all IOs (interfaces/ports) should be deleted
 */
async function testDeviceIosCascade(client: PoolClient): Promise<void> {
  try {
    // Create test device
    const deviceResult = await client.query(
      `INSERT INTO devices (hostname, device_type, status)
       VALUES ('test-device-cascade', 'switch', 'active')
       RETURNING id`
    )
    const deviceId = deviceResult.rows[0].id

    // Create test IOs
    await client.query(
      `INSERT INTO ios (device_id, interface_name, interface_type)
       VALUES ($1, 'eth0', 'ethernet'), ($1, 'eth1', 'ethernet'), ($1, 'eth2', 'ethernet')`,
      [deviceId]
    )

    // Verify IOs exist
    const iosBefore = await client.query('SELECT COUNT(*) FROM ios WHERE device_id = $1', [deviceId])
    const ioCountBefore = parseInt(iosBefore.rows[0].count)

    if (ioCountBefore !== 3) {
      throw new Error(`Expected 3 IOs, found ${ioCountBefore}`)
    }

    // Delete device
    await client.query('DELETE FROM devices WHERE id = $1', [deviceId])

    // Verify IOs were cascaded
    const iosAfter = await client.query('SELECT COUNT(*) FROM ios WHERE device_id = $1', [deviceId])
    const ioCountAfter = parseInt(iosAfter.rows[0].count)

    logTest('CASCADE: device → ios', ioCountAfter === 0, `Created 3 IOs, after delete: ${ioCountAfter} IOs`)
  } catch (error) {
    logTest('CASCADE: device → ios', false, undefined, String(error))
  }
}

/**
 * Test ON DELETE CASCADE: parent_device → child_devices
 * When a parent device is deleted, all child devices should be deleted
 */
async function testParentChildDeviceCascade(client: PoolClient): Promise<void> {
  try {
    // Create parent device (chassis)
    const parentResult = await client.query(
      `INSERT INTO devices (hostname, device_type, status)
       VALUES ('chassis-001', 'chassis', 'active')
       RETURNING id`
    )
    const parentId = parentResult.rows[0].id

    // Create child devices (line cards - using 'module' which is a valid device_type)
    await client.query(
      `INSERT INTO devices (hostname, device_type, status, parent_device_id)
       VALUES
         ('linecard-001', 'module', 'active', $1),
         ('linecard-002', 'module', 'active', $1)`,
      [parentId]
    )

    // Verify children exist
    const childrenBefore = await client.query('SELECT COUNT(*) FROM devices WHERE parent_device_id = $1', [parentId])
    const childCountBefore = parseInt(childrenBefore.rows[0].count)

    if (childCountBefore !== 2) {
      throw new Error(`Expected 2 child devices, found ${childCountBefore}`)
    }

    // Delete parent device
    await client.query('DELETE FROM devices WHERE id = $1', [parentId])

    // Verify children were cascaded
    const childrenAfter = await client.query('SELECT COUNT(*) FROM devices WHERE parent_device_id = $1', [parentId])
    const childCountAfter = parseInt(childrenAfter.rows[0].count)

    logTest(
      'CASCADE: parent_device → child_devices',
      childCountAfter === 0,
      `Created 2 child devices, after delete: ${childCountAfter} devices`
    )
  } catch (error) {
    logTest('CASCADE: parent_device → child_devices', false, undefined, String(error))
  }
}

/**
 * Test ON DELETE CASCADE: document → document_devices junction
 * When a document is deleted, all junction table entries should be deleted
 */
async function testDocumentJunctionCascade(client: PoolClient): Promise<void> {
  try {
    // Create test document
    const docResult = await client.query(
      `INSERT INTO documents (title, content, document_type)
       VALUES ('Test Document CASCADE', 'Content', 'runbook')
       RETURNING id`
    )
    const documentId = docResult.rows[0].id

    // Create test devices
    const device1 = await client.query(
      `INSERT INTO devices (hostname, device_type, status)
       VALUES ('device-doc-test-1', 'server', 'active')
       RETURNING id`
    )
    const device2 = await client.query(
      `INSERT INTO devices (hostname, device_type, status)
       VALUES ('device-doc-test-2', 'server', 'active')
       RETURNING id`
    )

    // Create junction table entries
    await client.query(
      `INSERT INTO document_devices (document_id, device_id)
       VALUES ($1, $2), ($1, $3)`,
      [documentId, device1.rows[0].id, device2.rows[0].id]
    )

    // Verify junction entries exist
    const linksBefore = await client.query('SELECT COUNT(*) FROM document_devices WHERE document_id = $1', [
      documentId,
    ])
    const linkCountBefore = parseInt(linksBefore.rows[0].count)

    if (linkCountBefore !== 2) {
      throw new Error(`Expected 2 links, found ${linkCountBefore}`)
    }

    // Delete document
    await client.query('DELETE FROM documents WHERE id = $1', [documentId])

    // Verify junction entries were cascaded
    const linksAfter = await client.query('SELECT COUNT(*) FROM document_devices WHERE document_id = $1', [documentId])
    const linkCountAfter = parseInt(linksAfter.rows[0].count)

    // Verify devices still exist
    const devicesStillExist = await client.query(
      'SELECT COUNT(*) FROM devices WHERE id = ANY($1)',
      [[device1.rows[0].id, device2.rows[0].id]]
    )
    const deviceCount = parseInt(devicesStillExist.rows[0].count)

    // Cleanup devices
    await client.query('DELETE FROM devices WHERE id = ANY($1)', [[device1.rows[0].id, device2.rows[0].id]])

    logTest(
      'CASCADE: document → document_devices junction',
      linkCountAfter === 0 && deviceCount === 2,
      `Created 2 links, after delete: ${linkCountAfter} links, ${deviceCount} devices still exist`
    )
  } catch (error) {
    logTest('CASCADE: document → document_devices junction', false, undefined, String(error))
  }
}

/**
 * Test ON DELETE SET NULL: company → location.company_id
 * When a company is deleted, location.company_id should be set to NULL
 */
async function testCompanyLocationSetNull(client: PoolClient): Promise<void> {
  try {
    // Create test company
    const companyResult = await client.query(
      `INSERT INTO companies (company_name, company_type)
       VALUES ('Test Company SET NULL', 'customer')
       RETURNING id`
    )
    const companyId = companyResult.rows[0].id

    // Create test location with company
    const locationResult = await client.query(
      `INSERT INTO locations (location_name, location_type, company_id)
       VALUES ('Test Location with Company', 'office', $1)
       RETURNING id`,
      [companyId]
    )
    const locationId = locationResult.rows[0].id

    // Verify location has company_id
    const locBefore = await client.query('SELECT company_id FROM locations WHERE id = $1', [locationId])
    if (locBefore.rows[0].company_id !== companyId) {
      throw new Error('Location company_id not set correctly')
    }

    // Delete company
    await client.query('DELETE FROM companies WHERE id = $1', [companyId])

    // Verify location still exists but company_id is NULL
    const locAfter = await client.query('SELECT company_id FROM locations WHERE id = $1', [locationId])
    const companyIdAfter = locAfter.rows[0].company_id

    // Cleanup location
    await client.query('DELETE FROM locations WHERE id = $1', [locationId])

    logTest(
      'SET NULL: company → location.company_id',
      companyIdAfter === null,
      `company_id before: ${companyId}, after: ${companyIdAfter}`
    )
  } catch (error) {
    logTest('SET NULL: company → location.company_id', false, undefined, String(error))
  }
}

/**
 * Test ON DELETE SET NULL: person → device.assigned_to_id
 * When a person is deleted, device.assigned_to_id should be set to NULL
 */
async function testPersonDeviceSetNull(client: PoolClient): Promise<void> {
  try {
    // Create test person
    const personResult = await client.query(
      `INSERT INTO people (full_name, email, person_type, status)
       VALUES ('Test Person SET NULL', 'test-set-null@example.com', 'employee', 'active')
       RETURNING id`
    )
    const personId = personResult.rows[0].id

    // Create test device assigned to person
    const deviceResult = await client.query(
      `INSERT INTO devices (hostname, device_type, status, assigned_to_id)
       VALUES ('test-device-assigned', 'computer', 'active', $1)
       RETURNING id`,
      [personId]
    )
    const deviceId = deviceResult.rows[0].id

    // Verify device is assigned
    const deviceBefore = await client.query('SELECT assigned_to_id FROM devices WHERE id = $1', [deviceId])
    if (deviceBefore.rows[0].assigned_to_id !== personId) {
      throw new Error('Device not assigned correctly')
    }

    // Delete person
    await client.query('DELETE FROM people WHERE id = $1', [personId])

    // Verify device still exists but assigned_to_id is NULL
    const deviceAfter = await client.query('SELECT assigned_to_id FROM devices WHERE id = $1', [deviceId])
    const assignedToAfter = deviceAfter.rows[0].assigned_to_id

    // Cleanup device
    await client.query('DELETE FROM devices WHERE id = $1', [deviceId])

    logTest(
      'SET NULL: person → device.assigned_to_id',
      assignedToAfter === null,
      `assigned_to_id before: ${personId}, after: ${assignedToAfter}`
    )
  } catch (error) {
    logTest('SET NULL: person → device.assigned_to_id', false, undefined, String(error))
  }
}

/**
 * Test ON DELETE SET NULL: network → io.native_network_id
 * When a network is deleted, io.native_network_id should be set to NULL
 */
async function testNetworkIoSetNull(client: PoolClient): Promise<void> {
  try {
    // Create test network
    const networkResult = await client.query(
      `INSERT INTO networks (network_name, vlan_id)
       VALUES ('Test VLAN SET NULL', 999)
       RETURNING id`
    )
    const networkId = networkResult.rows[0].id

    // Create test device
    const deviceResult = await client.query(
      `INSERT INTO devices (hostname, device_type, status)
       VALUES ('test-device-vlan', 'switch', 'active')
       RETURNING id`
    )
    const deviceId = deviceResult.rows[0].id

    // Create test IO with native network
    const ioResult = await client.query(
      `INSERT INTO ios (device_id, interface_name, interface_type, native_network_id)
       VALUES ($1, 'eth0', 'ethernet', $2)
       RETURNING id`,
      [deviceId, networkId]
    )
    const ioId = ioResult.rows[0].id

    // Verify IO has native_network_id
    const ioBefore = await client.query('SELECT native_network_id FROM ios WHERE id = $1', [ioId])
    if (ioBefore.rows[0].native_network_id !== networkId) {
      throw new Error('IO native_network_id not set correctly')
    }

    // Delete network
    await client.query('DELETE FROM networks WHERE id = $1', [networkId])

    // Verify IO still exists but native_network_id is NULL
    const ioAfter = await client.query('SELECT native_network_id FROM ios WHERE id = $1', [ioId])
    const nativeNetworkAfter = ioAfter.rows[0].native_network_id

    // Cleanup device (will cascade to IO)
    await client.query('DELETE FROM devices WHERE id = $1', [deviceId])

    logTest(
      'SET NULL: network → io.native_network_id',
      nativeNetworkAfter === null,
      `native_network_id before: ${networkId}, after: ${nativeNetworkAfter}`
    )
  } catch (error) {
    logTest('SET NULL: network → io.native_network_id', false, undefined, String(error))
  }
}

/**
 * Test complex multi-level cascade: location → rooms → room IOs
 * When a location is deleted, rooms cascade, and IOs in those rooms should have room_id set to NULL
 */
async function testMultiLevelCascade(client: PoolClient): Promise<void> {
  try {
    // Create test location
    const locResult = await client.query(
      `INSERT INTO locations (location_name, location_type)
       VALUES ('Test Location Multi-Level', 'office')
       RETURNING id`
    )
    const locationId = locResult.rows[0].id

    // Create test room
    const roomResult = await client.query(
      `INSERT INTO rooms (location_id, room_name, room_type)
       VALUES ($1, 'Test Room Multi-Level', 'office')
       RETURNING id`,
      [locationId]
    )
    const roomId = roomResult.rows[0].id

    // Create test device
    const deviceResult = await client.query(
      `INSERT INTO devices (hostname, device_type, status, room_id, location_id)
       VALUES ('test-device-multi', 'server', 'active', $1, $2)
       RETURNING id`,
      [roomId, locationId]
    )
    const deviceId = deviceResult.rows[0].id

    // Create test IO in room
    const ioResult = await client.query(
      `INSERT INTO ios (device_id, interface_name, interface_type, room_id)
       VALUES ($1, 'patch-port-1', 'patch_panel_port', $2)
       RETURNING id`,
      [deviceId, roomId]
    )
    const ioId = ioResult.rows[0].id

    // Verify setup
    const roomCheck = await client.query('SELECT location_id FROM rooms WHERE id = $1', [roomId])
    const ioCheck = await client.query('SELECT room_id FROM ios WHERE id = $1', [ioId])
    const deviceCheck = await client.query('SELECT room_id, location_id FROM devices WHERE id = $1', [deviceId])

    if (!roomCheck.rows[0] || !ioCheck.rows[0] || !deviceCheck.rows[0]) {
      throw new Error('Test data not set up correctly')
    }

    // Delete location
    await client.query('DELETE FROM locations WHERE id = $1', [locationId])

    // Verify room was cascaded
    const roomAfter = await client.query('SELECT COUNT(*) FROM rooms WHERE id = $1', [roomId])
    const roomExists = parseInt(roomAfter.rows[0].count) > 0

    // Verify device still exists but room_id and location_id are NULL
    const deviceAfter = await client.query('SELECT room_id, location_id FROM devices WHERE id = $1', [deviceId])
    const deviceStillExists = deviceAfter.rows.length > 0
    const deviceRoomId = deviceStillExists ? deviceAfter.rows[0].room_id : 'deleted'
    const deviceLocationId = deviceStillExists ? deviceAfter.rows[0].location_id : 'deleted'

    // Verify IO still exists but room_id is NULL
    const ioAfter = await client.query('SELECT room_id FROM ios WHERE id = $1', [ioId])
    const ioStillExists = ioAfter.rows.length > 0
    const ioRoomId = ioStillExists ? ioAfter.rows[0].room_id : 'deleted'

    // Cleanup device (will cascade to IO)
    if (deviceStillExists) {
      await client.query('DELETE FROM devices WHERE id = $1', [deviceId])
    }

    logTest(
      'MULTI-LEVEL: location → rooms → room_id SET NULL',
      !roomExists && deviceStillExists && deviceRoomId === null && deviceLocationId === null && ioRoomId === null,
      `Room deleted: ${!roomExists}, Device exists: ${deviceStillExists}, Device room_id: ${deviceRoomId}, IO room_id: ${ioRoomId}`
    )
  } catch (error) {
    logTest('MULTI-LEVEL: location → rooms → room_id SET NULL', false, undefined, String(error))
  }
}

/**
 * Test ON DELETE CASCADE: software_license → license assignments
 * When a license is deleted, all person and group assignments should be cascaded
 */
async function testLicenseAssignmentsCascade(client: PoolClient): Promise<void> {
  try {
    // Create test software
    const softwareResult = await client.query(
      `INSERT INTO software (product_name, software_category)
       VALUES ('Test Software License', 'productivity')
       RETURNING id`
    )
    const softwareId = softwareResult.rows[0].id

    // Create test license
    const licenseResult = await client.query(
      `INSERT INTO software_licenses (software_id, license_type, seat_count)
       VALUES ($1, 'subscription', 10)
       RETURNING id`,
      [softwareId]
    )
    const licenseId = licenseResult.rows[0].id

    // Create test person
    const personResult = await client.query(
      `INSERT INTO people (full_name, email, person_type, status)
       VALUES ('License Test Person', 'license-test@example.com', 'employee', 'active')
       RETURNING id`
    )
    const personId = personResult.rows[0].id

    // Create assignment
    await client.query(`INSERT INTO license_people (license_id, person_id) VALUES ($1, $2)`, [licenseId, personId])

    // Verify assignment exists
    const assignmentsBefore = await client.query('SELECT COUNT(*) FROM license_people WHERE license_id = $1', [
      licenseId,
    ])
    const assignmentCountBefore = parseInt(assignmentsBefore.rows[0].count)

    if (assignmentCountBefore !== 1) {
      throw new Error(`Expected 1 assignment, found ${assignmentCountBefore}`)
    }

    // Delete license
    await client.query('DELETE FROM software_licenses WHERE id = $1', [licenseId])

    // Verify assignments were cascaded
    const assignmentsAfter = await client.query('SELECT COUNT(*) FROM license_people WHERE license_id = $1', [
      licenseId,
    ])
    const assignmentCountAfter = parseInt(assignmentsAfter.rows[0].count)

    // Verify person still exists
    const personAfter = await client.query('SELECT COUNT(*) FROM people WHERE id = $1', [personId])
    const personExists = parseInt(personAfter.rows[0].count) > 0

    // Cleanup
    await client.query('DELETE FROM people WHERE id = $1', [personId])
    await client.query('DELETE FROM software WHERE id = $1', [softwareId])

    logTest(
      'CASCADE: software_license → license_people assignments',
      assignmentCountAfter === 0 && personExists,
      `Created 1 assignment, after delete: ${assignmentCountAfter} assignments, person still exists: ${personExists}`
    )
  } catch (error) {
    logTest('CASCADE: software_license → license_people assignments', false, undefined, String(error))
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n========================================')
  console.log('Foreign Key Relationship Tests')
  console.log('========================================\n')

  try {
    await transaction(async (client) => {
      console.log('Running ON DELETE CASCADE tests...\n')
      await testLocationRoomsCascade(client)
      await testDeviceIosCascade(client)
      await testParentChildDeviceCascade(client)
      await testDocumentJunctionCascade(client)
      await testLicenseAssignmentsCascade(client)

      console.log('\nRunning ON DELETE SET NULL tests...\n')
      await testCompanyLocationSetNull(client)
      await testPersonDeviceSetNull(client)
      await testNetworkIoSetNull(client)

      console.log('\nRunning multi-level cascade tests...\n')
      await testMultiLevelCascade(client)

      // Rollback all changes since we're just testing
      throw new Error('ROLLBACK: All tests complete, rolling back changes')
    })
  } catch (error) {
    if (String(error).includes('ROLLBACK')) {
      console.log('\n✅ All tests completed, changes rolled back\n')
    } else {
      console.error('\n❌ Transaction failed:', error)
    }
  }

  // Print summary
  console.log('========================================')
  console.log('Test Summary')
  console.log('========================================\n')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`)

  if (failed > 0) {
    console.log('Failed Tests:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ❌ ${r.testName}`)
        if (r.error) console.log(`     Error: ${r.error}`)
      })
    console.log()
  }

  await closePool()

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
