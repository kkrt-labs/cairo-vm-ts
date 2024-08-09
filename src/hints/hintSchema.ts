import { z } from 'zod';

import { allocSegmentParser } from './allocSegment';
import { assertLeFindSmallArcsParser } from './assertLeFindSmallArc';
import { assertLeIsFirstArcExcludedParser } from './assertLeIsFirstArcExcluded';
import { assertLeIsSecondArcExcludedParser } from './assertLeIsSecondArcExcluded';
import { allocFelt252DictParser } from './dict/allocFelt252Dict';
import { felt252DictEntryInitParser } from './dict/felt252DictEntryInit';
import { felt252DictEntryUpdateParser } from './dict/felt252DictEntryUpdate';
import { getCurrentAccessDeltaParser } from './dict/getCurrentAccessDelta';
import { getCurrentAccessIndexParser } from './dict/getCurrentAccessIndex';
import { getNextDictKeyParser } from './dict/getNextDictKey';
import { getSegmentArenaIndexParser } from './dict/getSegmentArenaIndex';
import { initSquashDataParser } from './dict/initSquashData';
import { shouldContinueSquashLoopParser } from './dict/shouldContinueSquashLoop';
import { shouldSkipSquashLoopParser } from './dict/shouldSkipSquashLoop';
import { testLessThanParser } from './math/testLessThan';
import { testLessThanOrEqualAddressParser } from './math/testLessThanOrEqualAddress';

/** Zod object to parse any implemented hints */
const hint = z.union([
  allocFelt252DictParser,
  allocSegmentParser,
  assertLeFindSmallArcsParser,
  assertLeIsFirstArcExcludedParser,
  assertLeIsSecondArcExcludedParser,
  felt252DictEntryInitParser,
  felt252DictEntryUpdateParser,
  getCurrentAccessDeltaParser,
  getCurrentAccessIndexParser,
  getNextDictKeyParser,
  getSegmentArenaIndexParser,
  initSquashDataParser,
  shouldContinueSquashLoopParser,
  shouldSkipSquashLoopParser,
  testLessThanParser,
  testLessThanOrEqualAddressParser,
]);

/** Zod object to parse an array of hints grouped on a given PC */
export const hintsGroup = z.tuple([z.number(), z.array(hint)]);

/** Zod object to parse an array of grouped hints */
export const hints = z
  .array(hintsGroup)
  .transform((hints) => new Map<number, Hint[]>(hints));

/** Union of all the implemented hints */
export type Hint = z.infer<typeof hint>;

/**
 * Tuple representing hints grouped at a PC offset
 *
 * - Format: `[PC.offset, Hint[]]`
 * - Example: `[5, [AllocSegment, TestLessThan]]`
 */
export type HintsGroup = z.infer<typeof hintsGroup>;

/** Array of HintsGroup
 *
 * Example: `[[2, TestLessThan], [5, AllocSegment, TestLessTha]]`
 */
export type Hints = z.infer<typeof hints>;
