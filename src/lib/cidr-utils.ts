/**
 * CIDR Calculation Utilities
 *
 * Provides utilities for IPv4 CIDR notation calculations including:
 * - Network address calculation
 * - Broadcast address calculation
 * - Subnet mask and wildcard mask calculation
 * - Host count and usable IP range calculation
 * - IP address validation
 */

export interface CIDRCalculation {
  // Input
  ipAddress: string
  cidrNotation: number // 0-32

  // Calculated values
  networkAddress: string
  broadcastAddress: string
  subnetMask: string
  wildcardMask: string
  firstUsableIP: string
  lastUsableIP: string
  totalHosts: number
  usableHosts: number

  // Additional info
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E'
  isPrivate: boolean
  binarySubnetMask: string
}

/**
 * Convert an IP address string to a 32-bit integer
 */
function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number)
  return (
    (parts[0] << 24) | // Shift first octet 24 bits left
    (parts[1] << 16) | // Shift second octet 16 bits left
    (parts[2] << 8) | // Shift third octet 8 bits left
    parts[3] // Fourth octet
  )
}

/**
 * Convert a 32-bit integer to an IP address string
 */
function intToIp(int: number): string {
  return [
    (int >>> 24) & 0xff, // Extract first octet
    (int >>> 16) & 0xff, // Extract second octet
    (int >>> 8) & 0xff, // Extract third octet
    int & 0xff, // Extract fourth octet
  ].join('.')
}

/**
 * Validate IPv4 address format
 * Exported for use in forms and validation
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipv4Regex.test(ip)
}

/**
 * Validate CIDR notation (must be 0-32)
 * Exported for use in forms and validation
 */
export function isValidCIDR(cidr: number): boolean {
  return Number.isInteger(cidr) && cidr >= 0 && cidr <= 32
}

/**
 * Calculate the subnet mask from CIDR notation
 */
function calculateSubnetMask(cidr: number): string {
  const mask = ~((1 << (32 - cidr)) - 1)
  return intToIp(mask >>> 0) // >>> 0 converts to unsigned
}

/**
 * Calculate the wildcard mask from CIDR notation
 */
function calculateWildcardMask(cidr: number): string {
  const wildcardInt = (1 << (32 - cidr)) - 1
  return intToIp(wildcardInt)
}

/**
 * Convert subnet mask to binary string representation
 */
function subnetMaskToBinary(mask: string): string {
  const parts = mask.split('.').map(Number)
  return parts.map((octet) => octet.toString(2).padStart(8, '0')).join('.')
}

/**
 * Determine IP address class (A, B, C, D, E)
 */
function getIPClass(ip: string): 'A' | 'B' | 'C' | 'D' | 'E' {
  const firstOctet = parseInt(ip.split('.')[0])

  if (firstOctet >= 1 && firstOctet <= 126) return 'A'
  if (firstOctet >= 128 && firstOctet <= 191) return 'B'
  if (firstOctet >= 192 && firstOctet <= 223) return 'C'
  if (firstOctet >= 224 && firstOctet <= 239) return 'D'
  return 'E'
}

/**
 * Check if IP address is in private range (RFC 1918)
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  const firstOctet = parts[0]
  const secondOctet = parts[1]

  // 10.0.0.0/8
  if (firstOctet === 10) return true

  // 172.16.0.0/12
  if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return true

  // 192.168.0.0/16
  if (firstOctet === 192 && secondOctet === 168) return true

  return false
}

/**
 * Main CIDR calculation function
 *
 * @param ipAddress - IPv4 address (e.g., "192.168.1.100")
 * @param cidr - CIDR notation (e.g., 24 for /24)
 * @returns CIDRCalculation object with all calculated values
 * @throws Error if inputs are invalid
 */
export function calculateCIDR(ipAddress: string, cidr: number): CIDRCalculation {
  // Validate inputs
  if (!isValidIPv4(ipAddress)) {
    throw new Error('Invalid IPv4 address format')
  }
  if (!isValidCIDR(cidr)) {
    throw new Error('Invalid CIDR notation (must be 0-32)')
  }

  // Calculate subnet mask
  const subnetMask = calculateSubnetMask(cidr)
  const wildcardMask = calculateWildcardMask(cidr)
  const binarySubnetMask = subnetMaskToBinary(subnetMask)

  // Convert IP and subnet mask to integers
  const ipInt = ipToInt(ipAddress)
  const maskInt = ipToInt(subnetMask)

  // Calculate network address (IP AND Subnet Mask)
  const networkInt = ipInt & maskInt
  const networkAddress = intToIp(networkInt)

  // Calculate broadcast address (Network OR Wildcard)
  const wildcardInt = ipToInt(wildcardMask)
  const broadcastInt = networkInt | wildcardInt
  const broadcastAddress = intToIp(broadcastInt)

  // Calculate first and last usable IPs
  const firstUsableInt = networkInt + 1
  const lastUsableInt = broadcastInt - 1
  const firstUsableIP = intToIp(firstUsableInt)
  const lastUsableIP = intToIp(lastUsableInt)

  // Calculate host counts
  const totalHosts = Math.pow(2, 32 - cidr)
  const usableHosts = Math.max(0, totalHosts - 2) // Subtract network and broadcast addresses

  // Get IP classification
  const ipClass = getIPClass(ipAddress)
  const isPrivate = isPrivateIP(ipAddress)

  return {
    ipAddress,
    cidrNotation: cidr,
    networkAddress,
    broadcastAddress,
    subnetMask,
    wildcardMask,
    firstUsableIP,
    lastUsableIP,
    totalHosts,
    usableHosts,
    ipClass,
    isPrivate,
    binarySubnetMask,
  }
}

/**
 * Parse CIDR string (e.g., "192.168.1.0/24") into IP and CIDR notation
 */
export function parseCIDRString(cidrString: string): { ip: string; cidr: number } | null {
  const parts = cidrString.trim().split('/')

  if (parts.length !== 2) {
    return null
  }

  const ip = parts[0]
  const cidr = parseInt(parts[1], 10)

  if (!isValidIPv4(ip) || !isValidCIDR(cidr)) {
    return null
  }

  return { ip, cidr }
}

/**
 * Check if an IP address is within a given network range
 */
export function isIPInNetwork(ipAddress: string, networkAddress: string, cidr: number): boolean {
  if (!isValidIPv4(ipAddress) || !isValidIPv4(networkAddress) || !isValidCIDR(cidr)) {
    return false
  }

  const ipInt = ipToInt(ipAddress)
  const networkInt = ipToInt(networkAddress)
  const maskInt = ipToInt(calculateSubnetMask(cidr))

  return (ipInt & maskInt) === networkInt
}

/**
 * Generate all usable IP addresses in a subnet
 * WARNING: Only use for small subnets (/24 and smaller)
 */
export function generateIPsInSubnet(networkAddress: string, cidr: number): string[] {
  if (!isValidIPv4(networkAddress) || !isValidCIDR(cidr)) {
    throw new Error('Invalid network address or CIDR notation')
  }

  // Safety check - don't generate for large networks
  if (cidr < 24) {
    throw new Error('Subnet too large to generate all IPs (use /24 or smaller)')
  }

  const calc = calculateCIDR(networkAddress, cidr)
  const firstInt = ipToInt(calc.firstUsableIP)
  const lastInt = ipToInt(calc.lastUsableIP)

  const ips: string[] = []
  for (let i = firstInt; i <= lastInt; i++) {
    ips.push(intToIp(i))
  }

  return ips
}

/**
 * Get the next available IP address after a given IP in the same subnet
 */
export function getNextIP(currentIP: string): string {
  if (!isValidIPv4(currentIP)) {
    throw new Error('Invalid IPv4 address')
  }

  const currentInt = ipToInt(currentIP)
  return intToIp(currentInt + 1)
}

/**
 * Calculate subnet information summary for display
 */
export interface SubnetSummary {
  notation: string // e.g., "192.168.1.0/24"
  usableRange: string // e.g., "192.168.1.1 - 192.168.1.254"
  hostCount: string // e.g., "254 usable hosts"
  subnetMask: string
  type: string // e.g., "Class C, Private"
}

export function getSubnetSummary(networkAddress: string, cidr: number): SubnetSummary {
  const calc = calculateCIDR(networkAddress, cidr)

  return {
    notation: `${calc.networkAddress}/${cidr}`,
    usableRange: `${calc.firstUsableIP} - ${calc.lastUsableIP}`,
    hostCount: `${calc.usableHosts.toLocaleString()} usable host${calc.usableHosts !== 1 ? 's' : ''}`,
    subnetMask: calc.subnetMask,
    type: `Class ${calc.ipClass}${calc.isPrivate ? ', Private' : ', Public'}`,
  }
}
