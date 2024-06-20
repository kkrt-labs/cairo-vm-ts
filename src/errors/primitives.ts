import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';

class PrimitiveError extends Error {}

// Felt and Relocatable errors

/** Expected a Felt */
export class ExpectedFelt extends PrimitiveError {
  constructor(value: any) {
    super(`Expected a Felt, received ${value}`);
  }
}

/** Expected a Relocatable */
export class ExpectedRelocatable extends PrimitiveError {
  constructor(value: any) {
    super(`Expected a Relocatable, received ${value}`);
  }
}

export class CannotDivideByZero extends PrimitiveError {
  constructor() {
    super('Cannot divide by zero');
  }
}

/** Offset underflow */
export class OffsetUnderflow extends PrimitiveError {
  constructor(value: SegmentValue, other: SegmentValue | number) {
    super(`Cannot substract ${other.toString()} from ${value.toString()}`);
  }
}
/** Segment error */
export class SegmentError extends PrimitiveError {
  constructor(value: Relocatable, other: Relocatable) {
    super(
      `Cannot operate on values with distinct segments: ${value.toString()} and ${other.toString()}`
    );
  }
}
