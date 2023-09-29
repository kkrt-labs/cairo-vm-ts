import { Result, Ok, Err, VMError } from 'result-pattern/result';
import { ConversionError, Felt } from './felt';
import { Uint64, UnsignedInteger } from './uint';

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
  private segmentIndex: Uint64;
  private offset: Uint64;

  constructor(segmentIndex: bigint, offset: bigint) {
    if (
      !UnsignedInteger.isUint64(segmentIndex) ||
      !UnsignedInteger.isUint64(offset)
    ) {
      throw new TypeError(
        'Both segmentIndex and offset must be positive integers.'
      );
    }
    this.segmentIndex = UnsignedInteger.toUint64(segmentIndex);
    this.offset = UnsignedInteger.toUint64(offset);
  }

  add(other: MaybeRelocatable | Uint64): Result<Relocatable, VMError> {
    if (other instanceof Felt) {
      const num = other.toUint64();
      if (num.isErr()) {
        return new Err(ConversionError);
      }
      if (this.getOffset() + num.unwrap() > Number.MAX_SAFE_INTEGER) {
        return new Err(OffsetOverflow);
      }
      return new Ok(
        new Relocatable(this.getSegmentIndex(), this.getOffset() + num.unwrap())
      );
    }

    if (other instanceof Relocatable) {
      return new Err(ForbiddenOperation);
    }

    return new Ok(
      new Relocatable(this.getSegmentIndex(), this.getOffset() + other)
    );
  }

  sub(other: MaybeRelocatable | Uint64): Result<Relocatable, VMError> {
    if (other instanceof Felt) {
      const delta = other.toUint64();

      if (delta.isErr()) {
        return delta;
      }

      if (this.getOffset() < delta.unwrap()) {
        return new Err(OffsetUnderflow);
      }
      return new Ok(
        new Relocatable(
          this.getSegmentIndex(),
          this.getOffset() - delta.unwrap()
        )
      );
    }

    if (other instanceof Relocatable) {
      if (this.offset < other.offset) {
        return new Err(OffsetUnderflow);
      }

      if (this.segmentIndex !== other.segmentIndex) {
        return new Err(SegmentError);
      }

      return new Ok(
        new Relocatable(this.segmentIndex, this.offset - other.offset)
      );
    }

    return new Ok(
      new Relocatable(this.getSegmentIndex(), this.getOffset() - other)
    );
  }

  getSegmentIndex(): Uint64 {
    return this.segmentIndex;
  }

  getOffset(): Uint64 {
    return this.offset;
  }
}
