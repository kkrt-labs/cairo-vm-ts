import { Felt } from './felt';
import {
  ForbiddenOperation,
  OffsetUnderflow,
  SegmentError,
} from 'errors/primitives';
import { MaybeRelocatable, isFelt, isRelocatable } from './maybeRelocatable';

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
    if (isFelt(other)) {
      const offset = new Felt(BigInt(this.offset));
      const newOffset = Number(offset.add(other));

      return new Relocatable(this.segment, newOffset);
    }

    if (isRelocatable(other)) {
      throw new ForbiddenOperation();
    }

    return new Relocatable(this.segment, this.offset + other);
  }

  sub(other: Felt): Relocatable;
  sub(other: number): Relocatable;
  sub(other: Relocatable): Felt;
  sub(other: MaybeRelocatable): MaybeRelocatable;
  sub(other: MaybeRelocatable | number): MaybeRelocatable {
    if (isFelt(other)) {
      const delta = Number(other);

      if (this.offset < delta) {
        throw new OffsetUnderflow();
      }
      return new Relocatable(this.segment, this.offset - delta);
    }

    if (isRelocatable(other)) {
      if (this.offset < other.offset) {
        throw new OffsetUnderflow();
      }

      if (this.segment !== other.segment) {
        throw new SegmentError();
      }

      return new Felt(BigInt(this.offset - other.offset));
    }

    if (this.offset < other) {
      throw new OffsetUnderflow();
    }

    return new Relocatable(this.segment, this.offset - other);
  }

  eq(other: MaybeRelocatable): boolean {
    return (
      !isFelt(other) &&
      other.offset === this.offset &&
      other.segment === this.segment
    );
  }

  toString(): string {
    return `${this.segment}:${this.offset}`;
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
