import { Ok, Err, VMError, Result } from 'result-pattern/result';
import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from 'primitives/relocatable';
import { Uint64, UnsignedInteger } from 'primitives/uint';

export class MemoryError extends Error {}

export const UnknownAddressError = {
  message:
    'MemoryError: tried to access memory at unknown or uninitialized address',
};

export const WriteOnceError = {
  message:
    'MemoryError: tried to write exisiting memory. Can only write to memory once.',
};

export class Memory {
  data: Map<Relocatable, MaybeRelocatable>;
  private numSegments: Uint64;

  constructor() {
    this.data = new Map();
    this.numSegments = UnsignedInteger.toUint64(0n);
  }

  insert(address: Relocatable, value: MaybeRelocatable): Result<true, VMError> {
    if (address.getSegmentIndex() >= this.numSegments) {
      return new Err(SegmentError);
    }

    if (this.data.get(address) !== undefined) {
      return new Err(WriteOnceError);
    }

    this.data.set(address, value);
    return new Ok(true);
  }

  get(address: Relocatable): Result<MaybeRelocatable, VMError> {
    const value = this.data.get(address);
    if (value === undefined) {
      return new Err(UnknownAddressError);
    }
    return new Ok(value);
  }

  incrementNumSegments() {
    this.numSegments = UnsignedInteger.toUint64(this.numSegments + 1n);
  }

  getNumSegments(): Uint64 {
    return this.numSegments;
  }
}
