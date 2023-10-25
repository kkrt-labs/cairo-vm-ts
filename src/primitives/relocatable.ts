import { Felt } from './felt';
import { Uint32, UnsignedInteger } from './uint';

export class RelocatableError extends Error {}

export type MaybeRelocatable = Relocatable | Felt;

export const RelocatableConversionError =
  'RelocatableError: cannot convert to relocatable';

export const OffsetOverflow = 'RelocatableError: offset overflow';

export const OffsetUnderflow = 'RelocatableError: offset overflow';

export const ForbiddenOperation = 'RelocatableError: forbidden operation';

export const SegmentError = 'RelocatableError: segment error';

export class Relocatable {
  private segmentIndex: Uint32;
  private offset: Uint32;

  constructor(segmentIndex: number, offset: number) {
    const segmentIndexUint = UnsignedInteger.toUint32(segmentIndex);
    const offsetUint = UnsignedInteger.toUint32(offset);
    this.segmentIndex = segmentIndexUint;
    this.offset = offsetUint;
  }

  add(other: MaybeRelocatable | Uint32): Relocatable {
    if (other instanceof Felt) {
      const num = other.toUint32();
      if (this.getOffset() + num > Number.MAX_SAFE_INTEGER) {
        throw new RelocatableError(OffsetOverflow);
      }
      return new Relocatable(this.getSegmentIndex(), this.getOffset() + num);
    }

    if (other instanceof Relocatable) {
      throw new RelocatableError(ForbiddenOperation);
    }

    return new Relocatable(this.getSegmentIndex(), this.getOffset() + other);
  }

  sub(other: MaybeRelocatable | Uint32): Relocatable {
    if (other instanceof Felt) {
      const delta = other.toUint32();

      if (this.getOffset() < delta) {
        throw new RelocatableError(OffsetUnderflow);
      }
      return new Relocatable(this.getSegmentIndex(), this.getOffset() - delta);
    }

    if (other instanceof Relocatable) {
      if (this.offset < other.offset) {
        throw new RelocatableError(OffsetUnderflow);
      }

      if (this.segmentIndex !== other.segmentIndex) {
        throw new RelocatableError(SegmentError);
      }

      return new Relocatable(this.segmentIndex, this.offset - other.offset);
    }

    return new Relocatable(this.getSegmentIndex(), this.getOffset() - other);
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
