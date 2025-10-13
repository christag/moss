#!/usr/bin/env node

/**
 * Script to automatically add caching to API route files
 *
 * This script:
 * 1. Finds all route.ts files in src/app/api
 * 2. Analyzes each file to determine if caching is already applied
 * 3. Adds caching imports and logic to GET/POST/PATCH/DELETE handlers
 * 4. Creates backups before modifying files
 *
 * Usage: node scripts/add-caching-to-apis.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Files to skip (already have caching or are special cases)
const SKIP_FILES = [
  'src/app/api/companies/route.ts',
  'src/app/api/companies/[id]/route.ts',
  'src/app/api/devices/route.ts',
  'src/app/api/devices/[id]/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/auth',
  'src/app/api/admin',
];

// Resource name extraction from path
function getResourceName(filePath) {
  // Extract resource from path: src/app/api/people/route.ts -> people
  const parts = filePath.split('/');
  const apiIndex = parts.indexOf('api');
  if (apiIndex >= 0 && apiIndex + 1 < parts.length) {
    return parts[apiIndex + 1];
  }
  return 'resource';
}

// Check if file should be skipped
function shouldSkip(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

// Check if file already has caching
function hasCaching(content) {
  return content.includes('import { cache') || content.includes('from \'@/lib/cache\'');
}

// Add caching import to file
function addCachingImport(content, isDetailRoute) {
  const imports = isDetailRoute
    ? 'import { cache, generateDetailCacheKey } from \'@/lib/cache\''
    : 'import { cache, generateListCacheKey } from \'@/lib/cache\'';

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, imports);
    return lines.join('\n');
  }

  return content;
}

// Add caching to GET list endpoint
function addListCaching(content, resourceName) {
  // Pattern: After validation and before database query
  // Look for: const validated = ...parse(
  // Then look for first database query after that

  const validatePattern = /const validated = [^=]+\.parse\([^)]+\)/;
  const match = content.match(validatePattern);

  if (!match) return content;

  const insertPos = content.indexOf(match[0]) + match[0].length;

  const cacheCode = `

    // Generate cache key
    const cacheKey = generateListCacheKey('${resourceName}', validated)

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, '${capitalize(resourceName)} retrieved successfully (cached)')
    }
`;

  // Insert cache check
  let modifiedContent = content.slice(0, insertPos) + cacheCode + content.slice(insertPos);

  // Add cache.set before return successResponse
  // Find the return successResponse in GET handler
  const successPattern = /return successResponse\(\s*\{[^}]*\}[^)]*\)/;
  const successMatch = modifiedContent.match(successPattern);

  if (successMatch) {
    // Replace return with cache.set + return
    const responseDataCode = `
    const responseData = ${successMatch[0].replace('return successResponse(', '').replace(/\)$/, '')}

    // Cache for 30 seconds
    cache.set(cacheKey, responseData, 30)

    return successResponse(responseData, '${capitalize(resourceName)} retrieved successfully')`;

    modifiedContent = modifiedContent.replace(successMatch[0], responseDataCode.trim());
  }

  return modifiedContent;
}

// Add caching to GET detail endpoint
function addDetailCaching(content, resourceName) {
  // Look for: const { id } = await params
  const idPattern = /const { id } = await params/;
  const match = content.match(idPattern);

  if (!match) return content;

  const insertPos = content.indexOf(match[0]) + match[0].length;

  const cacheCode = `

    // Check cache first
    const cacheKey = generateDetailCacheKey('${resourceName}', id)
    const cached = cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, '${capitalize(resourceName.slice(0, -1))} retrieved successfully (cached)')
    }
`;

  // Insert cache check
  let modifiedContent = content.slice(0, insertPos) + cacheCode + content.slice(insertPos);

  // Find the successful database query result and add cache.set
  // Pattern: const result = await query... then return successResponse(result.rows[0])
  const pattern = /return successResponse\(result\.rows\[0\]([^)]*)\)/;
  const successMatch = modifiedContent.match(pattern);

  if (successMatch) {
    const replacement = `
    const record = result.rows[0]

    // Cache for 60 seconds
    cache.set(cacheKey, record, 60)

    return successResponse(record${successMatch[1]})`;

    modifiedContent = modifiedContent.replace(successMatch[0], replacement.trim());
  }

  return modifiedContent;
}

// Add cache invalidation to POST
function addPostInvalidation(content, resourceName) {
  // Find return successResponse in POST handler (usually with 201 status)
  const patterns = [
    /return successResponse\([^,]+,[^,]*,\s*201\)/,
    /return successResponse\([^)]+\)(?=\s*}\s*catch)/
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const invalidation = `

    // Invalidate list cache
    cache.invalidatePattern('${resourceName}:list:*')

    ${match[0]}`;

      return content.replace(match[0], invalidation.trim());
    }
  }

  return content;
}

// Add cache invalidation to PATCH/DELETE
function addMutationInvalidation(content, resourceName) {
  // Find return successResponse in PATCH/DELETE handlers
  const pattern = /return successResponse\([^)]+\)(?=\s*}\s*catch)/g;
  const matches = [...content.matchAll(pattern)];

  let modifiedContent = content;
  let offset = 0;

  for (const match of matches) {
    const invalidation = `

    // Invalidate caches
    cache.invalidatePattern('${resourceName}:list:*')
    cache.delete(generateDetailCacheKey('${resourceName}', id))

    ${match[0]}`;

    const pos = match.index + offset;
    modifiedContent = modifiedContent.slice(0, pos) + invalidation.trim() + modifiedContent.slice(pos + match[0].length);
    offset += invalidation.length - match[0].length;
  }

  return modifiedContent;
}

// Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Process a single file
function processFile(filePath, dryRun = false) {
  console.log(`\n📄 Processing: ${filePath}`);

  if (shouldSkip(filePath)) {
    console.log('  ⏭️  Skipped (in skip list)');
    return { skipped: true };
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (hasCaching(content)) {
    console.log('  ✅ Already has caching');
    return { skipped: true };
  }

  const resourceName = getResourceName(filePath);
  const isDetailRoute = filePath.includes('[id]');

  console.log(`  📦 Resource: ${resourceName}`);
  console.log(`  🔍 Type: ${isDetailRoute ? 'Detail' : 'List'}`);

  let modifiedContent = content;

  // Add import
  modifiedContent = addCachingImport(modifiedContent, isDetailRoute);

  // Detect handlers present
  const hasGet = content.includes('export async function GET');
  const hasPost = content.includes('export async function POST');
  const hasPatch = content.includes('export async function PATCH');
  const hasDelete = content.includes('export async function DELETE');

  console.log(`  🔧 Handlers: GET=${hasGet} POST=${hasPost} PATCH=${hasPatch} DELETE=${hasDelete}`);

  // Apply caching based on route type and handlers
  if (hasGet) {
    if (isDetailRoute) {
      modifiedContent = addDetailCaching(modifiedContent, resourceName);
      console.log('  ✨ Added detail caching to GET');
    } else {
      modifiedContent = addListCaching(modifiedContent, resourceName);
      console.log('  ✨ Added list caching to GET');
    }
  }

  if (hasPost) {
    modifiedContent = addPostInvalidation(modifiedContent, resourceName);
    console.log('  ✨ Added cache invalidation to POST');
  }

  if (hasPatch || hasDelete) {
    modifiedContent = addMutationInvalidation(modifiedContent, resourceName);
    console.log('  ✨ Added cache invalidation to PATCH/DELETE');
  }

  if (modifiedContent === content) {
    console.log('  ⚠️  No changes made (handlers not found or already cached)');
    return { skipped: true };
  }

  if (!dryRun) {
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);

    // Write modified content
    fs.writeFileSync(filePath, modifiedContent);
    console.log('  💾 File updated (backup created)');
  } else {
    console.log('  🔍 DRY RUN - Changes would be applied');
  }

  return { modified: true };
}

// Find all route.ts files
function findRouteFiles(dir = 'src/app/api') {
  const files = [];

  function walk(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🚀 API Caching Automation Script\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  const files = findRouteFiles();
  console.log(`📊 Found ${files.length} API route files\n`);

  const stats = {
    total: files.length,
    modified: 0,
    skipped: 0,
    errors: 0
  };

  for (const file of files) {
    try {
      const result = processFile(file, dryRun);
      if (result.modified) {
        stats.modified++;
      } else if (result.skipped) {
        stats.skipped++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      stats.errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 Summary:');
  console.log(`  Total files: ${stats.total}`);
  console.log(`  Modified: ${stats.modified}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log('='.repeat(60));

  if (!dryRun && stats.modified > 0) {
    console.log('\n✅ Caching has been added to all applicable endpoints!');
    console.log('💡 Tip: Review the changes and run tests to ensure everything works.');
    console.log('📦 Backups created with .backup extension');
  }
}

// Run the script
main();
