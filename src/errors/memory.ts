import { SegmentValue } from 'primitives/segmentValue';

export class MemoryError extends Error {}

/** Read a different value (`newValue`) than the already constrained value (`oldValue`) at `address` */
export class InconsistentMemory extends MemoryError {
  public readonly offset: number;
  public readonly oldValue: SegmentValue;
  public readonly newValue: SegmentValue;

  constructor(offset: number, oldValue: SegmentValue, newValue: SegmentValue) {
    super();
    this.offset = offset;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }
}

/** Trying to read on a segment that is not accessible (`segmentId >= segmentNumber`) */
export class SegmentOutOfBounds extends MemoryError {
  public readonly segmentId: number;
  public readonly segmentNumber: number;

  constructor(segmentId: number, segmentNumber: number) {
    super();
    this.segmentId = segmentId;
    this.segmentNumber = segmentNumber;
  }
}

/** Instruction must be a Field Element */
export class InstructionError extends MemoryError {}
