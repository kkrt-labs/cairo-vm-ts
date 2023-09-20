import { Felt } from './felt';
import { Uint, UnsignedInteger } from './uint';

export class RelocatableError extends Error {}
export class OffsetUnderflow extends RelocatableError {}
export class SegmentError extends RelocatableError {}
export class ForbiddenOperation extends RelocatableError {}
export class TypeError extends RelocatableError {}

export type MaybeRelocatable = Relocatable | Felt;

export class Relocatable {
  private segmentIndex: Uint;
  private offset: Uint;

  constructor(segmentIndex: number, offset: number) {
    if (
      !UnsignedInteger.isUint(segmentIndex) ||
      !UnsignedInteger.isUint(offset)
    ) {
      throw new TypeError('Both segmentIndex and offset must be integers.');
    }
    this.segmentIndex = UnsignedInteger.toUint(segmentIndex);
    this.offset = UnsignedInteger.toUint(offset);
  }

  sub(other: Relocatable): Relocatable {
    if (this.offset < other.offset) {
      throw new OffsetUnderflow();
    }

    if (this.segmentIndex !== other.segmentIndex) {
      throw new SegmentError();
    }

    return new Relocatable(this.segmentIndex, this.offset - other.offset);
  }

  addPositiveNumber(other: Uint): Relocatable {
    return new Relocatable(this.getSegmentIndex(), this.getOffset() + other);
  }

  /**
   * Adds a Felt and a Relocatable
   * Panics: throws an error if a.inner > Number.MAX_SAFE_INTEGER
   */
  addFelt(other: Felt): Relocatable {
    return new Relocatable(
      this.getSegmentIndex(),
      this.getOffset() + other.toNumber()
    );
  }

  /**
   * Sub a Felt and a Relocatable
   * Panics: throws an error if a.inner > Number.MAX_SAFE_INTEGER
   */
  subFelt(felt: Felt): Relocatable {
    const delta = felt.toNumber();
    if (this.getOffset() < delta) {
      throw new OffsetUnderflow();
    }
    return new Relocatable(this.getSegmentIndex(), this.getOffset() - delta);
  }

  addMaybeRelocatable(other: MaybeRelocatable): Relocatable {
    if (other instanceof Felt) {
      return this.addFelt(other);
    } else {
      throw new ForbiddenOperation();
    }
  }

  subMaybeRelocatable(other: MaybeRelocatable): Relocatable {
    if (other instanceof Felt) {
      return this.subFelt(other);
    }

    if (other instanceof Relocatable) {
      return this.sub(other);
    }

    // We need to throw an error in case `other` is neither a Felt or a Relocatable for the Typescript compiler
    throw new RelocatableError();
  }

  getSegmentIndex(): Uint {
    return this.segmentIndex;
  }

  getOffset(): Uint {
    return this.offset;
  }
}
