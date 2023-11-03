import { BaseError, ErrorType } from 'result/error';
import { Felt } from './felt';
import { Uint32, UnsignedInteger } from './uint';
import {
  ForbiddenOperation,
  OffsetOverflow,
  OffsetUnderflow,
  SegmentError,
} from 'result/primitives';
import { Err, Result } from 'result/result';

export type MaybeRelocatable = Relocatable | Felt;

export class Relocatable {
  private segmentIndex: Uint32;
  private offset: Uint32;

  constructor(segmentIndex: number, offset: number) {
    const { value: segmentUint, error: indexErr } =
      UnsignedInteger.toUint32(segmentIndex);
    const { value: offsetUint, error: offsetErr } =
      UnsignedInteger.toUint32(offset);
    if (indexErr !== undefined) {
      throw indexErr;
    }
    if (offsetErr !== undefined) {
      throw offsetErr;
    }
    this.segmentIndex = segmentUint;
    this.offset = offsetUint;
  }

  add(other: MaybeRelocatable): Result<MaybeRelocatable>;
  add(other: Felt | Uint32): Result<Relocatable>;
  add(other: Relocatable): Err;

  add(other: MaybeRelocatable | Uint32): Result<MaybeRelocatable> {
    if (other instanceof Felt) {
      const { value: num, error } = other.toUint32();
      if (error !== undefined) {
        return { value: undefined, error };
      }

      if (this.getOffset() + num > UnsignedInteger.MAX_UINT32) {
        return {
          value: undefined,
          error: new BaseError(ErrorType.RelocatableError, OffsetOverflow),
        };
      }
      return {
        value: new Relocatable(this.getSegmentIndex(), this.getOffset() + num),
        error: undefined,
      };
    }

    if (other instanceof Relocatable) {
      return {
        value: undefined,
        error: new BaseError(ErrorType.RelocatableError, ForbiddenOperation),
      };
    }

    return {
      value: new Relocatable(this.getSegmentIndex(), this.getOffset() + other),
      error: undefined,
    };
  }

  sub(other: MaybeRelocatable): Result<MaybeRelocatable>;
  sub(other: Felt | Uint32): Result<Relocatable>;
  sub(other: Relocatable): Result<Felt>;

  sub(other: MaybeRelocatable | Uint32): Result<MaybeRelocatable> {
    if (other instanceof Felt) {
      const { value: delta, error } = other.toUint32();
      if (error !== undefined) {
        return { value: undefined, error };
      }

      if (this.getOffset() < delta) {
        return {
          value: undefined,
          error: new BaseError(ErrorType.RelocatableError, OffsetUnderflow),
        };
      }
      return {
        value: new Relocatable(
          this.getSegmentIndex(),
          this.getOffset() - delta
        ),
        error: undefined,
      };
    }

    if (other instanceof Relocatable) {
      if (this.offset < other.offset) {
        return {
          value: undefined,
          error: new BaseError(ErrorType.RelocatableError, OffsetUnderflow),
        };
      }

      if (this.segmentIndex !== other.segmentIndex) {
        return {
          value: undefined,
          error: new BaseError(ErrorType.RelocatableError, SegmentError),
        };
      }

      return {
        value: new Felt(BigInt(this.offset - other.offset)),
        error: undefined,
      };
    }

    if (this.getOffset() < other) {
      return {
        value: undefined,
        error: new BaseError(ErrorType.RelocatableError, OffsetUnderflow),
      };
    }

    return {
      value: new Relocatable(this.getSegmentIndex(), this.getOffset() - other),
      error: undefined,
    };
  }

  div(_: MaybeRelocatable | Uint32): Err {
    return {
      value: undefined,
      error: new BaseError(ErrorType.RelocatableError, ForbiddenOperation),
    };
  }

  div(_: MaybeRelocatable | Uint32): Err {
    return {
      value: undefined,
      error: new BaseError(ErrorType.RelocatableError, ForbiddenOperation),
    };
  }

  getSegmentIndex(): Uint32 {
    return this.segmentIndex;
  }

  getOffset(): Uint32 {
    return this.offset;
  }

  static isRelocatable(
    maybeRelocatable: MaybeRelocatable
  ): maybeRelocatable is Relocatable {
    return maybeRelocatable instanceof Relocatable;
  }

  static getRelocatable(
    maybeRelocatable: MaybeRelocatable
  ): Relocatable | undefined {
    if (Relocatable.isRelocatable(maybeRelocatable)) {
      return maybeRelocatable;
    }
    return undefined;
  }
}

/**
 * Subclass of Relocatable, specific to the Allocation Pointer (Ap) and the Frame Pointer (Fp)
 * These CairoVM registers are considered relocatables must only have segment index equal to 1
 * as they always point to the execution segment.
 */
export class MemoryPointer extends Relocatable {
  constructor(offset: number) {
    super(1, offset);
  }
}

/**
 * Subclass of Relocatable, specific to the Program Counter (PC).
 * PC points to the program segment. Its segment will be 0 until the last instruction.
 * At the end of a program run, the PC will be set to the end pointer, i.e. the address of the end segment.
 */
export class ProgramCounter extends Relocatable {
  constructor(offset: number) {
    super(0, offset);
  }
}
