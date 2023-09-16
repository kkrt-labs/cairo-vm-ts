import { Felt } from './felt';
import { OffsetUnderflow, Relocatable, SegmentError } from './relocatable';
import { InternalError, NotImplementedError } from './types';

export type MaybeRelocatable = Relocatable | Felt;

/**
 * Adds a Felt and a Relocatable
 * Panics: throws an error if a.inner > Number.MAX_SAFE_INTEGER
 */
function addFeltRelocatable(a: Felt, b: Relocatable): MaybeRelocatable {
  return new Relocatable(b.getSegmentIndex(), b.getOffset() + a.toNumber());
}

/**
 * Sub a Felt and a Relocatable
 * Panics: throws an error if a.inner > Number.MAX_SAFE_INTEGER
 */
function subFeltRelocatable(a: Felt, b: Relocatable): MaybeRelocatable {
  const aAsOffset = a.toNumber();
  if (b.getOffset() < aAsOffset) {
    throw new OffsetUnderflow();
  }
  return new Relocatable(b.getSegmentIndex(), b.getOffset() - a.toNumber());
}

export function add(
  a: MaybeRelocatable,
  b: MaybeRelocatable
): MaybeRelocatable {
  if (a instanceof Felt && b instanceof Felt) {
    return a.add(b);
  }

  if (a instanceof Felt && b instanceof Relocatable) {
    return addFeltRelocatable(a, b);
  }

  if (b instanceof Felt && a instanceof Relocatable) {
    return addFeltRelocatable(b, a);
  }

  if (a instanceof Relocatable && b instanceof Relocatable) {
    return a.add(b);
  }

  throw new InternalError();
}

export function sub(
  a: MaybeRelocatable,
  b: MaybeRelocatable
): MaybeRelocatable {
  if (a instanceof Felt && b instanceof Felt) {
    return a.sub(b);
  }

  if (a instanceof Felt && b instanceof Relocatable) {
    return subFeltRelocatable(a, b);
  }

  if (b instanceof Felt && a instanceof Relocatable) {
    return subFeltRelocatable(b, a);
  }

  if (a instanceof Relocatable && b instanceof Relocatable) {
    a.sub(b);
  }

  throw new InternalError();
}
