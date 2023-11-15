import {
  MemoryError,
  SegmentIncrementError,
  WriteOnceError,
} from 'result/memory';
import { SegmentError } from 'result/primitives';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';

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
    const { value: numSegments, error } = UnsignedInteger.toUint32(
      this.numSegments + 1
    );
    if (error !== undefined) {
      throw new MemoryError(SegmentIncrementError);
    }
    this.numSegments = numSegments;
  }

  getNumSegments(): Uint32 {
    return this.numSegments;
  }
}
