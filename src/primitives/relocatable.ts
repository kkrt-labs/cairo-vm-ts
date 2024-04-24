import { Felt } from './felt';
import {
  ForbiddenOperation,
  OffsetUnderflow,
  PrimitiveError,
  SegmentError,
} from 'errors/primitives';

export type MaybeRelocatable = Relocatable | Felt;

export class Relocatable {
  segment: number;
  offset: number;

  constructor(segment: number, offset: number) {
    this.segment = segment;
    this.offset = offset;
  }

  add(other: Felt): Relocatable;
  add(other: number): Relocatable;
  add(other: Relocatable): never;
  add(other: MaybeRelocatable): MaybeRelocatable;
  add(other: MaybeRelocatable | number): MaybeRelocatable {
    if (other instanceof Felt) {
      const offset = new Felt(BigInt(this.offset));
      const newOffset = Number(offset.add(other));

      return new Relocatable(this.segment, newOffset);
    }

    if (other instanceof Relocatable) {
      throw new PrimitiveError(ForbiddenOperation);
    }

    return new Relocatable(this.segment, this.offset + other);
  }

  sub(other: Felt): Relocatable;
  sub(other: number): Relocatable;
  sub(other: Relocatable): Felt;
  sub(other: MaybeRelocatable): MaybeRelocatable;
  sub(other: MaybeRelocatable | number): MaybeRelocatable {
    if (other instanceof Felt) {
      const delta = Number(other);

      if (this.offset < delta) {
        throw new PrimitiveError(OffsetUnderflow);
      }
      return new Relocatable(this.segment, this.offset - delta);
    }

    if (other instanceof Relocatable) {
      if (this.offset < other.offset) {
        throw new PrimitiveError(OffsetUnderflow);
      }

      if (this.segment !== other.segment) {
        throw new PrimitiveError(SegmentError);
      }

      return new Felt(BigInt(this.offset - other.offset));
    }

    if (this.offset < other) {
      throw new PrimitiveError(OffsetUnderflow);
    }

    return new Relocatable(this.segment, this.offset - other);
  }

  eq(other: MaybeRelocatable): boolean {
    if (other instanceof Felt) {
      return false;
    }
    if (other.offset === this.offset && other.segment === this.segment) {
      return true;
    }
    return false;
  }

  toString(): string {
    return `${this.segment}:${this.offset}`;
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
