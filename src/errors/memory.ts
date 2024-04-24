export class MemoryError extends Error {}

/** Write existing memory. Can only write to memory once */
export class WriteOnceError extends MemoryError {}

/** Trying to write on the segment `segment_index`
 * while only `segment_number` are currently defined
 */
export class WriteInvalidSegment extends MemoryError {
  public readonly segment_index: number;
  public readonly segment_number: number;

  constructor(segment_index: number, segment_number: number) {
    super();
    this.segment_index = segment_index;
    this.segment_number = segment_number;
  }
}

/** Instruction must be a Field Element */
export class InstructionError extends MemoryError {}
