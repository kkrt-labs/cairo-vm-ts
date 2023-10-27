import { Ok, Err, VMError, Result } from 'result-pattern/result';
import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';

export class MemoryError extends Error {}

export const UnknownAddressError = {
  message:
    'MemoryError: tried to access memory at unknown or uninitialized address',
};

export const WriteOnceError = {
  message:
    'MemoryError: tried to write existing memory. Can only write to memory once.',
};

export class Memory {
  data: Map<Relocatable, MaybeRelocatable>;
  private numSegments: Uint32;

  constructor() {
    this.data = new Map();
    this.numSegments = UnsignedInteger.ZERO_UINT32;
  }

  insert(address: Relocatable, value: MaybeRelocatable): Result<true, VMError> {
    if (address.getSegmentIndex() >= this.numSegments) {
      return new Err(SegmentError);
    }

    if (this.data.get(address) !== undefined) {
      return new Err(WriteOnceError);
    }

    this.data.set(address, value);
    return new Ok(true as const);
  }

  get(address: Relocatable): Result<MaybeRelocatable, VMError> {
    const value = this.data.get(address);
    if (value === undefined) {
      return new Err(UnknownAddressError);
    }
    return new Ok(value);
  }

  incrementNumSegments() {
    const newNumSegments = UnsignedInteger.toUint32(this.numSegments + 1);
    if (newNumSegments.isErr()) {
      throw new MemoryError(
        'MemoryError: error incrementing number of segments'
      );
    }
    this.numSegments = newNumSegments.unwrap();
  }

  getNumSegments(): Uint32 {
    return this.numSegments;
  }
}
