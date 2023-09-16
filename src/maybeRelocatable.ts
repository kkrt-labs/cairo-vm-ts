import { Felt } from './felt';
import {
  ForbiddenOperation,
  OffsetUnderflow,
  Relocatable,
} from './relocatable';
import { InternalError } from './types';

export type MaybeRelocatable = Relocatable | Felt;

/**
 * Adds a Felt and a Relocatable
 * Panics: throws an error if a.inner > Number.MAX_SAFE_INTEGER
 */
function addRelocatableFelt(
  relocatable: Relocatable,
  felt: Felt
): MaybeRelocatable {
  return new Relocatable(
    relocatable.getSegmentIndex(),
    relocatable.getOffset() + felt.toNumber()
  );
}

/**
 * Sub a Felt and a Relocatable
 * Panics: throws an error if a.inner > Number.MAX_SAFE_INTEGER
 */
function subRelocatableFelt(
  relocatable: Relocatable,
  felt: Felt
): MaybeRelocatable {
  const feltAsOffset = felt.toNumber();
  if (relocatable.getOffset() < feltAsOffset) {
    throw new OffsetUnderflow();
  }
  return new Relocatable(
    relocatable.getSegmentIndex(),
    relocatable.getOffset() - feltAsOffset
  );
}

export function add(
  a: MaybeRelocatable,
  b: MaybeRelocatable
): MaybeRelocatable {
  if (a instanceof Felt && b instanceof Felt) {
    return a.add(b);
  }

  if (a instanceof Felt && b instanceof Relocatable) {
    return addRelocatableFelt(b, a);
  }

  if (b instanceof Felt && a instanceof Relocatable) {
    return addRelocatableFelt(a, b);
  }

  if (a instanceof Relocatable && b instanceof Relocatable) {
    return a.add(b);
  }

  throw new InternalError();
}

/**
 * Compute a - b
 */
export function sub(
  a: MaybeRelocatable,
  b: MaybeRelocatable
): MaybeRelocatable {
  if (a instanceof Felt && b instanceof Felt) {
    return a.sub(b);
  }

  if (a instanceof Relocatable && b instanceof Felt) {
    return subRelocatableFelt(a, b);
  }

  // Cannot substract a Relocatable from a Felt
  if (a instanceof Felt && b instanceof Relocatable) {
    throw new ForbiddenOperation();
  }

  if (a instanceof Relocatable && b instanceof Relocatable) {
    a.sub(b);
  }

  throw new InternalError();
}
