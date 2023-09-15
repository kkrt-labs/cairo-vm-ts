class RelocatableError extends Error {}
class OffsetUnderflow extends RelocatableError {}
class SegmentError extends RelocatableError {}

class Relocatable {
  segmentIndex: number;
  offset: number;

  constructor(segmentIndex: number, offset: number) {
    this.segmentIndex = segmentIndex;
    this.offset = offset;
  }

  add(other: MaybeRelocatable | number): Relocatable {
    if (other instanceof Relocatable) throw new NotImplementedError();
    const offset = other instanceof Felt ? other.toNumber() : other;
    return new Relocatable(this.segmentIndex, this.offset + offset);
  }

  sub(other: MaybeRelocatable): Relocatable {
    const offset = other instanceof Felt ? other.toNumber() : other.offset;
    if (this.offset < offset) {
      throw new OffsetUnderflow();
    }

    if (
      other instanceof Relocatable &&
      this.segmentIndex !== other.segmentIndex
    ) {
      throw new SegmentError();
    }

    return new Relocatable(this.segmentIndex, this.offset - offset);
  }
}
