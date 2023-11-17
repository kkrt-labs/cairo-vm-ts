import { MemoryError, SegmentIncrementError } from 'errors/memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { UnsignedInteger } from 'primitives/uint';

export class Memory {
  data: Map<string, MaybeRelocatable>;
  private numSegments: number;

  constructor() {
    this.data = new Map();
    this.numSegments = 0;
  }

  get(address: Relocatable): MaybeRelocatable | undefined {
    const addressString = `${address.getSegmentIndex()}:${address.getOffset()}`;
    return this.data.get(addressString);
  }

  incrementNumSegments(): void {
    try {
      this.numSegments += 1;
      UnsignedInteger.ensureUint32(this.numSegments);
    } catch (err) {
      throw new MemoryError(SegmentIncrementError);
    }
  }

  getNumSegments(): number {
    return this.numSegments;
  }
}
