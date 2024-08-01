import { BuiltinHandler } from './builtin';

/**
 * Offset to compute the address
 * of the info segment pointer.
 */
export const INFO_PTR_OFFSET = 3;

/**
 * Offset to read the current number
 * of allocated dictionaries.
 */
export const DICT_NUMBER_OFFSET = 2;

/**
 * The segment arena builtin manages Cairo dictionaries.
 *
 * It works by block of 3 cells:
 * - The first cell contains the base address of the info pointer.
 * - The second cell contains the current number of allocated dictionaries.
 * - The third cell contains the current number of squashed dictionaries.
 *
 * The Info segment is tightly closed to the segment arena builtin.
 *
 * It also works by block of 3 cells:
 * - The first cell is the base address of a dictionary
 * - The second cell is the end address of a dictionary when squashed.
 * - The third cell is the current number of squashed dictionaries (i.e. its squashing index).
 */
export const segmentArenaHandler: BuiltinHandler = {};
