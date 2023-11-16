import { MemoryError, SegmentIncrementError } from 'result/memory';
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
