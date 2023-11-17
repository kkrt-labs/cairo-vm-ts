import { MemoryError, SegmentIncrementError } from 'errors/memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';

export class Memory {
  data: Map<string, MaybeRelocatable>;
  private numSegments: Uint32;

  constructor() {
    this.data = new Map();
    this.numSegments = UnsignedInteger.ZERO_UINT32;
  }

  get(address: Relocatable): MaybeRelocatable | undefined {
    const addressString = `${address.getSegmentIndex()}:${address.getOffset()}`;
    return this.data.get(addressString);
  }

  incrementNumSegments(): void {
    try {
      const numSegments = UnsignedInteger.toUint32(this.numSegments + 1);
      this.numSegments = numSegments;
    } catch (err) {
      throw new MemoryError(SegmentIncrementError);
    }
  }

  getNumSegments(): Uint32 {
    return this.numSegments;
  }
}
