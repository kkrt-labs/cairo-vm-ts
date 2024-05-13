import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';

export class MemoryError extends Error {}

/** Read a different value (`newValue`) than the already constrained value (`oldValue`) at `address` */
export class InconsistentMemory extends MemoryError {
  public readonly address: Relocatable;
  public readonly oldValue: SegmentValue;
  public readonly newValue: SegmentValue;

  constructor(
    address: Relocatable,
    oldValue: SegmentValue,
    newValue: SegmentValue
  ) {
    super();
    this.address = address;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }
}

/** Trying to read on a segment that is not accessible (`segmentIndex >= segmentNumber`) */
export class SegmentOutOfBounds extends MemoryError {
  public readonly segmentIndex: number;
  public readonly segmentNumber: number;

  constructor(segment_index: number, segment_number: number) {
    super();
    this.segmentIndex = segment_index;
    this.segmentNumber = segment_number;
  }
}

/** Instruction must be a Field Element */
export class InstructionError extends MemoryError {}
