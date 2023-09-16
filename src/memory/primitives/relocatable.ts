export class RelocatableError extends Error {}
export class OffsetUnderflow extends RelocatableError {}
export class SegmentError extends RelocatableError {}
export class ForbiddenOperation extends RelocatableError {}

export class Relocatable {
  private segmentIndex: number;
  private offset: number;

  constructor(segmentIndex: number, offset: number) {
    this.segmentIndex = segmentIndex;
    this.offset = offset;
  }

  add(_other: Relocatable | number): Relocatable {
    throw new ForbiddenOperation();
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

  getSegmentIndex(): number {
    return this.segmentIndex;
  }

  getOffset(): number {
    return this.offset;
  }
}
