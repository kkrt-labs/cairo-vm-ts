import { z } from 'zod';

import { allocSegmentParser } from './allocSegment';
import { testLessThanParser } from './testLessThan';

/** Zod object to parse any implemented hints */
const hint = z.union([allocSegmentParser, testLessThanParser]);

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
