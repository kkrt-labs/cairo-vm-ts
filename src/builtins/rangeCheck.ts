import { ExpectedOffset, RangeCheckOutOfBounds } from 'errors/builtins';
import { BuiltinHandler } from './builtin';
import { isFelt } from 'primitives/segmentValue';
import { ExpectedFelt } from 'errors/primitives';

export const INNER_RC_BOUND_SHIFT = 16;
export const INNER_RC_BOUND_MASK = 0xffffn;

export const RC_N_PARTS = 8;
export const RC_N_PARTS_96 = 6;

/** Bound exponent of the range_check builtin, `128`. */
export const RC_BITS = BigInt(INNER_RC_BOUND_SHIFT * RC_N_PARTS);

/** Bound exponent of the range_check96 builtin, `96`. */
export const RC_BITS_96 = BigInt(INNER_RC_BOUND_SHIFT * RC_N_PARTS_96);

export const rangeCheckHandler = (boundExponent: bigint): BuiltinHandler => {
  return {
    set(target, prop, newValue): boolean {
      if (isNaN(Number(prop))) throw new ExpectedOffset();

      const offset = Number(prop);
      if (!isFelt(newValue)) throw new ExpectedFelt(newValue);
      if (newValue.toBigInt() >> boundExponent !== 0n)
        throw new RangeCheckOutOfBounds(newValue, boundExponent);

      target[offset] = newValue;
      return true;
    },
  };
};
