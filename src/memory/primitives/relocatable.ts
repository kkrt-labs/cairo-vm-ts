import { Felt } from './felt';

export class RelocatableError extends Error {}
export class OffsetUnderflow extends RelocatableError {}
export class SegmentError extends RelocatableError {}
export class ForbiddenOperation extends RelocatableError {}

export type MaybeRelocatable = Relocatable | Felt;

export class Relocatable {
  private segmentIndex: number;
  private offset: number;

  constructor(segmentIndex: number, offset: number) {
    this.segmentIndex = segmentIndex;
    this.offset = offset;
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

  addNumber(other: number): Relocatable {
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

  getSegmentIndex(): number {
    return this.segmentIndex;
  }

  getOffset(): number {
    return this.offset;
  }
}
