import { ExpectedFelt, OffsetUnderflow, SegmentError } from 'errors/primitives';

import { Felt } from './felt';
import { SegmentValue, isFelt, isRelocatable } from './segmentValue';

export class Relocatable {
  segmentId: number;
  offset: number;

  constructor(segmentId: number, offset: number) {
    this.segmentId = segmentId;
    this.offset = offset;
  }

  add(other: Felt): Relocatable;
  add(other: number): Relocatable;
  add(other: Relocatable): never;
  add(other: SegmentValue): SegmentValue;
  add(other: SegmentValue | number): SegmentValue {
    if (isFelt(other)) {
      const offset = new Felt(BigInt(this.offset));
      const newOffset = Number(offset.add(other));

      return new Relocatable(this.segmentId, newOffset);
    }

    if (isRelocatable(other)) {
      throw new ExpectedFelt(other);
    }

    return new Relocatable(this.segmentId, this.offset + other);
  }

  sub(other: Felt): Relocatable;
  sub(other: number): Relocatable;
  sub(other: Relocatable): Felt;
  sub(other: SegmentValue): SegmentValue;
  sub(other: SegmentValue | number): SegmentValue {
    if (isFelt(other)) {
      const delta = Number(other);

      if (this.offset < delta) {
        throw new OffsetUnderflow(this, other);
      }
      return new Relocatable(this.segmentId, this.offset - delta);
    }

    if (isRelocatable(other)) {
      if (this.offset < other.offset) {
        throw new OffsetUnderflow(this, other);
      }

      if (this.segmentId !== other.segmentId) {
        throw new SegmentError(this, other);
      }

      return new Felt(BigInt(this.offset - other.offset));
    }

    if (this.offset < other) {
      throw new OffsetUnderflow(this, other);
    }

    return new Relocatable(this.segmentId, this.offset - other);
  }

  eq(other: SegmentValue): boolean {
    return (
      !isFelt(other) &&
      other.offset === this.offset &&
      other.segmentId === this.segmentId
    );
  }

  toString(): string {
    return `${this.segmentId}:${this.offset}`;
  }
}
