# Implementation Plan

- [x] 1. Set up project structure and dependencies


  - Create `scripts/` directory if not exists
  - Add fast-check as dev dependency for property-based testing
  - Create `scripts/import_local_scripts.ts` entry point file
  - _Requirements: 5.1_




- [ ] 2. Implement metadata extraction utilities





  - [x] 2.1 Create `scripts/lib/metadata-extractor.ts` with title and player count parsing functions






    - Implement `extractTitleFromFolderName(folderName: string): string`

    - Implement `parsePlayerCount(folderName: string): { min: number; max: number }`
    - Implement `inferCategory(folderName: string): string`
    - Implement `inferDifficulty(folderName: string): string`
    - _Requirements: 1.2, 1.3, 4.2, 4.3, 4.4_
  - [x] 2.2 Write property test for player count parsing

    - **Property 1: Player count parsing consistency**
    - **Validates: Requirements 1.3**

- [x] 3. Implement directory scanner


  - [x] 3.1 Create `scripts/lib/script-scanner.ts` with folder detection logic


    - Implement `scanRootDirectory(rootPath: string): Promise<ScriptFolder[]>`
    - Implement `isValidScriptFolder(folderPath: string): Promise<boolean>`
    - Detect handbook, character, clue, and audio subfolders
    - _Requirements: 1.1, 1.4, 1.5_

- [x] 4. Implement story data generator


  - [x] 4.1 Create `scripts/lib/story-data-generator.ts` with JSON generation logic


    - Implement `generateStoryData(folder: ScriptFolder, metadata: ScriptMetadata): StoryData`
    - Implement `extractCharacters(characterFolderPath: string): Character[]`
    - Implement `extractClues(clueFolderPath: string): Clue[]`
    - Implement `extractAudioFiles(audioFolderPath: string): AudioFile[]`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 4.2 Write property test for character entry completeness


    - **Property 2: Character entry completeness**
    - **Validates: Requirements 2.2**
  - [x] 4.3 Write property test for clue entry completeness

    - **Property 3: Clue entry completeness**
    - **Validates: Requirements 2.3**
  - [x] 4.4 Write property test for JSON round-trip

    - **Property 4: Story data JSON round-trip**
    - **Validates: Requirements 2.5**

- [x] 5. Implement database service


  - [x] 5.1 Create `scripts/lib/database-service.ts` with Supabase operations


    - Implement `checkExists(title: string): Promise<boolean>`
    - Implement `insertStory(story: StoryRecord): Promise<void>`
    - Handle connection using environment variables
    - _Requirements: 3.1, 3.2, 5.1, 5.2_
  - [x] 5.2 Write property test for duplicate detection


    - **Property 5: Duplicate detection prevents insertion**
    - **Validates: Requirements 3.1**





- [x] 6. Implement default value assignment




  - [ ] 6.1 Create `scripts/lib/defaults.ts` with default value functions


    - Implement `getDefaultCoverUrl(category: string): string`

    - Implement `generateDescription(title: string): string`



    - _Requirements: 4.1, 4.5_

  - [ ] 6.2 Write property test for default cover URL validity

    - **Property 7: Default cover URL validity**

    - **Validates: Requirements 4.1**

  - [x] 6.3 Write property test for description contains title

    - **Property 8: Description contains title**


    - **Validates: Requirements 4.5**

- [ ] 7. Implement main import orchestrator

  - [ ] 7.1 Create main import function in `scripts/import_local_scripts.ts`

    - Wire together scanner, extractor, generator, and database service
    - Implement error handling and continuation on failures
    - Track and report inserted/skipped/error counts
    - _Requirements: 3.3, 5.3, 5.4_
  - [ ] 7.2 Write property test for import counts consistency
    - **Property 6: Import counts consistency**
    - **Validates: Requirements 3.3**
  - [ ] 7.3 Write property test for error resilience
    - **Property 9: Error resilience continuation**
    - **Validates: Requirements 5.4**

- [ ] 8. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integration and CLI finalization

  - [ ] 9.1 Add CLI argument parsing and help output
    - Support `--dry-run` flag to preview without inserting
    - Support `--verbose` flag for detailed logging
    - _Requirements: 5.1, 5.3_
  - [ ] 9.2 Add environment variable validation at startup
    - Check for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    - Exit with clear error message if missing
    - _Requirements: 5.2_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

