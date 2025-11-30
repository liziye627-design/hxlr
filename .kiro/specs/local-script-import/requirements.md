# Requirements Document

## Introduction

This feature enables importing local script folders (剧本杀 scripts) from the project root directory into the `stories` database table. The import script will scan designated directories, extract metadata from folder structures and file names, and insert the scripts into Supabase so they appear in the Script Murder Lobby.

## Glossary

- **Script (剧本)**: A murder mystery game script containing character handbooks, clues, and game materials
- **Stories Table**: The Supabase database table that stores script metadata for display in the lobby
- **Import Script**: A TypeScript utility that scans local directories and inserts script data into the database
- **Script Folder**: A root-level directory containing all materials for a single murder mystery script
- **Character Handbook (角色剧本)**: PDF files containing individual character backstories and information
- **Clue (线索)**: PDF or image files containing game clues for investigation
- **Handbook (主持人手册/组织者手册)**: The game master's guide PDF

## Requirements

### Requirement 1

**User Story:** As a developer, I want to run an import script that scans local script folders, so that I can populate the database with available scripts without manual data entry.

#### Acceptance Criteria

1. WHEN the import script executes, THE Import_Script SHALL scan the root directory for script folders matching known patterns (e.g., folders containing "剧本" or "手册" subfolders)
2. WHEN a valid script folder is detected, THE Import_Script SHALL extract the script title from the folder name
3. WHEN extracting metadata, THE Import_Script SHALL parse player count from folder names containing patterns like "(7人开放)" or "(4人)"
4. WHEN a script folder contains a "主持人手册" or "组织者手册" subfolder, THE Import_Script SHALL identify the handbook PDF path
5. WHEN a script folder contains a "角色剧本" or "剧本" subfolder, THE Import_Script SHALL enumerate all character PDF files

### Requirement 2

**User Story:** As a developer, I want the import script to generate proper story_data JSON, so that the Script Murder game can load characters and clues correctly.

#### Acceptance Criteria

1. WHEN generating story_data, THE Import_Script SHALL create a valid JSON structure containing scriptId, characters array, clues array, and gameAssets object
2. WHEN processing character files, THE Import_Script SHALL generate character entries with id, name (extracted from filename), and pdfPath fields
3. WHEN processing clue files, THE Import_Script SHALL generate clue entries with id, title, pdfPath, and description fields
4. WHEN audio files exist in the script folder, THE Import_Script SHALL include them in the audioFiles array with appropriate trigger metadata
5. WHEN serializing story_data to JSON, THE Import_Script SHALL produce valid JSON that can be deserialized back to an equivalent object (round-trip consistency)

### Requirement 3

**User Story:** As a developer, I want the import script to handle duplicate detection, so that re-running the import does not create duplicate entries.

#### Acceptance Criteria

1. WHEN a script with the same title already exists in the database, THE Import_Script SHALL skip insertion and log a message indicating the script was skipped
2. WHEN checking for duplicates, THE Import_Script SHALL use the script title as the unique identifier
3. WHEN the import completes, THE Import_Script SHALL report the count of scripts inserted and scripts skipped

### Requirement 4

**User Story:** As a developer, I want the import script to assign appropriate default values, so that imported scripts display correctly in the lobby.

#### Acceptance Criteria

1. WHEN no cover image is found, THE Import_Script SHALL assign a default cover URL from Unsplash based on the script category
2. WHEN category cannot be determined, THE Import_Script SHALL default to "mystery" category
3. WHEN difficulty cannot be determined, THE Import_Script SHALL default to "normal" difficulty
4. WHEN player count cannot be parsed from folder name, THE Import_Script SHALL default to min_players=4 and max_players=8
5. WHEN generating script description, THE Import_Script SHALL create a placeholder description based on the script title

### Requirement 5

**User Story:** As a developer, I want the import script to be executable via command line, so that I can run it easily during development.

#### Acceptance Criteria

1. WHEN executed with `npx tsx scripts/import_local_scripts.ts`, THE Import_Script SHALL connect to Supabase using environment variables
2. WHEN Supabase credentials are missing, THE Import_Script SHALL exit with an error message indicating which variables are required
3. WHEN the import process completes successfully, THE Import_Script SHALL exit with code 0 and print a summary
4. IF an error occurs during database insertion, THEN THE Import_Script SHALL log the error details and continue processing remaining scripts

