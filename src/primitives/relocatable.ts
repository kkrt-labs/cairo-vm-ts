import { Result, Ok, Err, VMError } from 'result-pattern/result';
import { Felt } from './felt';
import { Uint32, UnsignedInteger } from './uint';

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
  private segmentIndex: Uint32;
  private offset: Uint32;

  constructor(segmentIndex: number, offset: number) {
    const segmentIndexResult = UnsignedInteger.toUint32(segmentIndex);
    const offsetResult = UnsignedInteger.toUint32(offset);
    if (segmentIndexResult.isErr()) {
      throw segmentIndexResult.unwrapErr();
    }
    if (offsetResult.isErr()) {
      throw offsetResult.unwrapErr();
    }
    this.segmentIndex = segmentIndexResult.unwrap();
    this.offset = offsetResult.unwrap();
  }

  add(other: MaybeRelocatable | Uint32): Result<Relocatable, VMError> {
    if (other instanceof Felt) {
      const num = other.toUint32();
      if (num.isErr()) {
        return num;
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

  sub(other: MaybeRelocatable | Uint32): Result<Relocatable, VMError> {
    if (other instanceof Felt) {
      const delta = other.toUint32();

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

  getSegmentIndex(): Uint32 {
    return this.segmentIndex;
  }

  getOffset(): Uint32 {
    return this.offset;
  }
}
