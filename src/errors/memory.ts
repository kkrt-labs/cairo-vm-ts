import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';

class MemoryError extends Error {}

/** Read a different value (`newValue`) than the already constrained value (`oldValue`) at `address` */
export class InconsistentMemory extends MemoryError {
  constructor(
    address: Relocatable,
    oldValue: SegmentValue,
    newValue: SegmentValue
  ) {
    super(
      `Inconsistent memory at ${address.toString()}: trying to assert ${newValue.toString()} when already constrained to ${oldValue.toString()}`
    );
  }
}

/** Trying to read on a segment that is not accessible (`segmentId >= segmentNumber`) */
export class SegmentOutOfBounds extends MemoryError {
  constructor(segmentId: number, segmentNumber: number) {
    super(
      `Trying to read segment ${segmentId} that is not accessible: there are only ${segmentNumber} segments`
    );
  }
}
