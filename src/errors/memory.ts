import { MaybeRelocatable } from 'primitives/relocatable';

export class MemoryError extends Error {}

/** Write existing memory. Can only write to memory once */
export class InconsistentMemory extends MemoryError {
  public readonly oldValue: MaybeRelocatable;
  public readonly newValue: MaybeRelocatable;

  constructor(oldValue: MaybeRelocatable, newValue: MaybeRelocatable) {
    super();
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
