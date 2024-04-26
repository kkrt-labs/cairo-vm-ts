import { Felt } from './felt';
import { Relocatable } from './relocatable';

export type MaybeRelocatable = Relocatable | Felt;

export function isFelt(
  maybeRelocatable: MaybeRelocatable
): maybeRelocatable is Felt;
export function isFelt(
  maybeRelocatable: MaybeRelocatable | number
): maybeRelocatable is Felt;
export function isFelt(
  maybeRelocatable: MaybeRelocatable | number
): maybeRelocatable is Felt {
  return maybeRelocatable instanceof Felt;
}

export function isRelocatable(
  maybeRelocatable: MaybeRelocatable
): maybeRelocatable is Relocatable;
export function isRelocatable(
  maybeRelocatable: number | Relocatable
): maybeRelocatable is Relocatable;
export function isRelocatable(
  maybeRelocatable: MaybeRelocatable | number
): maybeRelocatable is Relocatable {
  return maybeRelocatable instanceof Relocatable;
}
