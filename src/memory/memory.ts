import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';

export class MemoryError extends Error {}

export const UnknownAddressError =
  'MemoryError: tried to access memory at unknown or uninitialized address';

export const WriteOnceError =
  'MemoryError: tried to write existing memory. Can only write to memory once.';

export const SegmentIncrementError =
  'MemoryError: error incrementing number of segments';

export class Memory {
  data: Map<Relocatable, MaybeRelocatable>;
  private numSegments: Uint32;

  constructor() {
    this.data = new Map();
    this.numSegments = UnsignedInteger.ZERO_UINT32;
  }

  insert(address: Relocatable, value: MaybeRelocatable): void {
    if (address.getSegmentIndex() >= this.numSegments) {
      throw new MemoryError(SegmentError);
    }

    if (this.data.get(address) !== undefined) {
      throw new MemoryError(WriteOnceError);
    }

    this.data.set(address, value);
  }

  get(address: Relocatable): MaybeRelocatable | undefined {
    return this.data.get(address);
  }

  incrementNumSegments(): void {
    const newNumSegments = UnsignedInteger.toUint32(this.numSegments + 1);
    this.numSegments = newNumSegments;
  }

  getNumSegments(): Uint32 {
    return this.numSegments;
  }
}
