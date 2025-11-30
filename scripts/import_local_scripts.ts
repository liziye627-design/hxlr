/**
 * Local Script Import Tool
 * 
 * Scans local script folders and imports them into the Supabase stories table.
 * Usage: npx tsx scripts/import_local_scripts.ts [--dry-run] [--verbose]
 * 
 * Environment variables required:
 * - SUPABASE_URL or VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { scanRootDirectory } from './lib/script-scanner';
import { extractMetadataFromFolderName } from './lib/metadata-extractor';
import { generateStoryData } from './lib/story-data-generator';
import { createDatabaseService, initializeSupabase, type DatabaseService } from './lib/database-service';
import { getDefaultCoverUrl, generateDescription, generateUUID } from './lib/defaults';
import type { ImportResult, ScriptFolder, StoryRecord } from './lib/types';

// Load environment variables
dotenv.config();

interface ImportOptions {
  dryRun: boolean;
  verbose: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };
}

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials.');
    console.error('Please set the following environment variables:');
    console.error('  - SUPABASE_URL (or VITE_SUPABASE_URL)');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
  }
}

/**
 * Process a single script folder
 */
async function processScriptFolder(
  folder: ScriptFolder,
  dbService: DatabaseService,
  options: ImportOptions
): Promise<{ status: 'inserted' | 'skipped' | 'error'; error?: string }> {
  const metadata = extractMetadataFromFolderName(folder.name);
  
  if (options.verbose) {
    console.log(`  📁 Processing: ${folder.name}`);
    console.log(`     Title: ${metadata.title}`);
    console.log(`     Players: ${metadata.minPlayers}-${metadata.maxPlayers}`);
    console.log(`     Category: ${metadata.category}`);
  }

  try {
    // Check for duplicates
    const exists = await dbService.checkExists(metadata.title);
    if (exists) {
      if (options.verbose) {
        console.log(`     ⏭️  Skipped (already exists)`);
      }
      return { status: 'skipped' };
    }

    // Generate story data
    const storyData = generateStoryData(folder, metadata);
    
    // Create story record
    const storyRecord: StoryRecord = {
      id: generateUUID(),
      title: metadata.title,
      category: metadata.category,
      difficulty: metadata.difficulty,
      min_players: metadata.minPlayers,
      max_players: metadata.maxPlayers,
      description: generateDescription(metadata.title),
      cover_url: getDefaultCoverUrl(metadata.category),
      story_data: storyData,
      is_premium: false,
    };

    if (options.dryRun) {
      console.log(`     🔍 Would insert: ${metadata.title}`);
      if (options.verbose) {
        console.log(`     Characters: ${storyData.characters.length}`);
        console.log(`     Clues: ${storyData.clues.length}`);
      }
      return { status: 'inserted' };
    }

    // Insert into database
    await dbService.insertStory(storyRecord);
    
    if (options.verbose) {
      console.log(`     ✅ Inserted successfully`);
    }
    
    return { status: 'inserted' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (options.verbose) {
      console.log(`     ❌ Error: ${errorMessage}`);
    }
    return { status: 'error', error: errorMessage };
  }
}

/**
 * Main import function
 */
export async function importLocalScripts(
  rootPath: string,
  dbService: DatabaseService,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  console.log(`\n🔍 Scanning directory: ${rootPath}\n`);

  // Scan for script folders
  const scriptFolders = await scanRootDirectory(rootPath);
  
  console.log(`📚 Found ${scriptFolders.length} script folder(s)\n`);

  if (scriptFolders.length === 0) {
    console.log('No script folders found.');
    return result;
  }

  // Process each folder
  for (const folder of scriptFolders) {
    const { status, error } = await processScriptFolder(folder, dbService, options);
    
    switch (status) {
      case 'inserted':
        result.inserted++;
        break;
      case 'skipped':
        result.skipped++;
        break;
      case 'error':
        result.errors.push({ folder: folder.name, error: error || 'Unknown error' });
        break;
    }
  }

  return result;
}

/**
 * Print import summary
 */
function printSummary(result: ImportResult, options: ImportOptions): void {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN - No changes were made');
  }
  
  console.log(`✅ Inserted: ${result.inserted}`);
  console.log(`⏭️  Skipped:  ${result.skipped}`);
  console.log(`❌ Errors:   ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const { folder, error } of result.errors) {
      console.log(`  - ${folder}: ${error}`);
    }
  }
  
  console.log('='.repeat(50) + '\n');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('🎭 Local Script Import Tool');
  console.log('===========================\n');

  const options = parseArgs();
  
  if (options.dryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
  }

  // Validate environment (skip in dry-run mode for testing)
  if (!options.dryRun) {
    validateEnvironment();
    initializeSupabase();
  }

  const dbService = createDatabaseService();
  const rootPath = path.resolve(process.cwd());

  try {
    const result = await importLocalScripts(rootPath, dbService, options);
    printSummary(result, options);
    
    // Exit with appropriate code
    if (result.errors.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();
