import { initialSchemaMigration } from './001-initial-schema';
import { phaseTwoIndexesMigration } from './002-phase-two-indexes';
import { phaseThreeStudyMigration } from './003-phase-three-study';
import { phaseFourStatisticsMigration } from './004-phase-four-statistics';
import { phaseFiveOfflinePlatformMigration } from './005-phase-five-offline-platform';
import type { DatabaseMigration } from './types';

export const migrations: readonly DatabaseMigration[] = [
  initialSchemaMigration,
  phaseTwoIndexesMigration,
  phaseThreeStudyMigration,
  phaseFourStatisticsMigration,
  phaseFiveOfflinePlatformMigration,
];
