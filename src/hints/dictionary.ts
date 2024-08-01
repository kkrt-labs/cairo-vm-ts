import { Felt } from 'primitives/felt';
import { SegmentValue } from 'primitives/segmentValue';

export const DICT_ACCESS_SIZE = 3;

/** Offset to read the key of the entry to update. */
export const KEY_OFFSET = 3;

/**
 * Offset to read the previous value
 * of the entry to read or update.
 */
export const PREV_VALUE_OFFSET = 1;

/**
 * Helper class to implement Cairo dictionaries.
 *
 * The `id` attribute is needed to keep track
 * of the multiple dictionaries and their
 * corresponding segment in memory.
 */
export class Dictionary extends Map<string, SegmentValue> {
  constructor(public readonly id: Felt) {
    super();
    this.id = id;
  }
}
