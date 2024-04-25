export class MemoryError extends Error {}

/** Write existing memory. Can only write to memory once */
export class WriteOnceError extends MemoryError {}

/** Trying to read on a segment that is not accessible (`segmentIndex >= segmentNumber`)
 */
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
