import { Result, VMError } from '../../result-pattern/result';
import { ConversionError, Felt } from './felt';
import { Uint, UnsignedInteger } from './uint';

export class RelocatableError extends Error {}
export class TypeError extends RelocatableError {}
export class InternalError extends RelocatableError {}

export type MaybeRelocatable = Relocatable | Felt;

export const OffsetOverflow = {
  message: 'RelocatableError: offset overflow',
};

export const OffsetUnderflow = {
  message: 'RelocatableError: offset overflow',
};

export const ForbiddenOperation = {
  message: 'RelocatableError: forbidden operation',
};

export const SegmentError = {
  message: 'RelocatableError: segment error',
};

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

  add(other: MaybeRelocatable | Uint): Result<Relocatable, VMError> {
    if (other instanceof Felt) {
      const num = other.toNumber();
      if (num.isErr()) {
        return Result.error(ConversionError);
      }
      if (this.getOffset() + num.unwrap() > Number.MAX_SAFE_INTEGER) {
        return Result.error(OffsetOverflow);
      }
      return Result.ok(
        new Relocatable(this.getSegmentIndex(), this.getOffset() + num.unwrap())
      );
    }

    if (other instanceof Relocatable) {
      return Result.error(ForbiddenOperation);
    }

    return Result.ok(
      new Relocatable(this.getSegmentIndex(), this.getOffset() + other)
    );
  }

  sub(other: MaybeRelocatable | Uint): Result<Relocatable, VMError> {
    if (other instanceof Felt) {
      const delta = other.toNumber().unwrapOrUndefined();
      if (delta === undefined) {
        return Result.error(ConversionError);
      }
      if (this.getOffset() < delta) {
        return Result.error(OffsetUnderflow);
      }
      return Result.ok(
        new Relocatable(this.getSegmentIndex(), this.getOffset() - delta)
      );
    }

    if (other instanceof Relocatable) {
      if (this.offset < other.offset) {
        return Result.error(OffsetUnderflow);
      }

      if (this.segmentIndex !== other.segmentIndex) {
        return Result.error(SegmentError);
      }

      return Result.ok(
        new Relocatable(this.segmentIndex, this.offset - other.offset)
      );
    }

    return Result.ok(
      new Relocatable(this.getSegmentIndex(), this.getOffset() - other)
    );
  }

  getSegmentIndex(): Uint {
    return this.segmentIndex;
  }

  getOffset(): Uint {
    return this.offset;
  }
}
