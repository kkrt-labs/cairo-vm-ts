import { Felt } from './felt';
import { Uint32, UnsignedInteger } from './uint';
import {
  ForbiddenOperation,
  OffsetUnderflow,
  PrimitiveError,
  SegmentError,
} from 'errors/primitives';

export type MaybeRelocatable = Relocatable | Felt;

export class Relocatable {
  private segmentIndex: Uint32;
  private offset: Uint32;

  constructor(segmentIndex: number, offset: number) {
    const segmentUint = UnsignedInteger.toUint32(segmentIndex);
    const offsetUint = UnsignedInteger.toUint32(offset);
    this.segmentIndex = segmentUint;
    this.offset = offsetUint;
  }

  add(other: Felt): Relocatable;
  add(other: Uint32): Relocatable;
  add(other: Relocatable): never;
  add(other: MaybeRelocatable): MaybeRelocatable;
  add(other: MaybeRelocatable | Uint32): MaybeRelocatable {
    if (other instanceof Felt) {
      const offset = new Felt(BigInt(this.getOffset()));
      const newOffset = offset.add(other).toUint32();

      return new Relocatable(this.getSegmentIndex(), newOffset);
    }

    if (other instanceof Relocatable) {
      throw new PrimitiveError(ForbiddenOperation);
    }

    return new Relocatable(this.getSegmentIndex(), this.getOffset() + other);
  }

  sub(other: Felt): Relocatable;
  sub(other: Uint32): Relocatable;
  sub(other: Relocatable): Felt;
  sub(other: MaybeRelocatable): MaybeRelocatable;
  sub(other: MaybeRelocatable | Uint32): MaybeRelocatable {
    if (other instanceof Felt) {
      const delta = other.toUint32();

      if (this.getOffset() < delta) {
        throw new PrimitiveError(OffsetUnderflow);
      }
      return new Relocatable(this.getSegmentIndex(), this.getOffset() - delta);
    }

    if (other instanceof Relocatable) {
      if (this.offset < other.offset) {
        throw new PrimitiveError(OffsetUnderflow);
      }

      if (this.segmentIndex !== other.segmentIndex) {
        throw new PrimitiveError(SegmentError);
      }

      return new Felt(BigInt(this.offset - other.offset));
    }

    if (this.getOffset() < other) {
      throw new PrimitiveError(OffsetUnderflow);
    }

    return new Relocatable(this.getSegmentIndex(), this.getOffset() - other);
  }

  eq(other: MaybeRelocatable): boolean {
    if (other instanceof Felt) {
      return false;
    }
    if (
      other.offset === this.offset &&
      other.segmentIndex === this.segmentIndex
    ) {
      return true;
    }
    return false;
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
