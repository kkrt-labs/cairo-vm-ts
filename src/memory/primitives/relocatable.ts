import { Felt } from './felt';
import { Uint, UnsignedInteger } from './uint';

export class RelocatableError extends Error {}
export class OffsetUnderflow extends RelocatableError {}
export class OffsetOverflow extends RelocatableError {}
export class SegmentError extends RelocatableError {}
export class ForbiddenOperation extends RelocatableError {}
export class TypeError extends RelocatableError {}
export class InternalError extends RelocatableError {}

export type MaybeRelocatable = Relocatable | Felt;

export class Relocatable {
  private segmentIndex: Uint;
  private offset: Uint;

  constructor(segmentIndex: number, offset: number) {
    if (
      !UnsignedInteger.isUint(segmentIndex) ||
      !UnsignedInteger.isUint(offset)
    ) {
      throw new TypeError(
        'Both segmentIndex and offset must be positive integers.'
      );
    }
    this.segmentIndex = UnsignedInteger.toUint(segmentIndex);
    this.offset = UnsignedInteger.toUint(offset);
  }

  add(other: MaybeRelocatable | Uint): Relocatable {
    if (other instanceof Felt) {
      if (this.getOffset() + other.toNumber() > Number.MAX_SAFE_INTEGER) {
        throw new OffsetOverflow();
      }
      return new Relocatable(
        this.getSegmentIndex(),
        this.getOffset() + other.toNumber()
      );
    }

    if (other instanceof Relocatable) {
      throw new ForbiddenOperation();
    }

    return new Relocatable(this.getSegmentIndex(), this.getOffset() + other);
  }

  sub(other: MaybeRelocatable | Uint): Relocatable {
    if (other instanceof Felt) {
      const delta = other.toNumber();
      if (this.getOffset() < delta) {
        throw new OffsetUnderflow();
      }
      return new Relocatable(this.getSegmentIndex(), this.getOffset() - delta);
    }

    if (other instanceof Relocatable) {
      if (this.offset < other.offset) {
        throw new OffsetUnderflow();
      }

      if (this.segmentIndex !== other.segmentIndex) {
        throw new SegmentError();
      }

      return new Relocatable(this.segmentIndex, this.offset - other.offset);
    }

    return new Relocatable(this.getSegmentIndex(), this.getOffset() - other);
  }

  getSegmentIndex(): Uint {
    return this.segmentIndex;
  }

  getOffset(): Uint {
    return this.offset;
  }
}
