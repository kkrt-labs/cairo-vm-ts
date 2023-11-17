import { UnsignedInteger } from 'primitives/uint';
import { Memory } from './memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { MemoryError, WriteOnceError } from 'errors/memory';
import { SegmentError } from 'errors/primitives';

export class MemorySegmentManager {
  private segmentSizes: Map<number, number>;
  memory: Memory;

  constructor() {
    this.segmentSizes = new Map();
    this.memory = new Memory();
  }

  addSegment(): Relocatable {
    const ptr = new Relocatable(this.memory.getNumSegments(), 0);
    this.memory.incrementNumSegments();
    return ptr;
  }

  loadData(address: Relocatable, data: MaybeRelocatable[]): Relocatable {
    for (const [index, d] of data.entries()) {
      const nextAddress = address.add(index);
      this.insert_inner(nextAddress, d);
    }

    const newSegmentSize =
      this.getSegmentSize(address.getSegmentIndex()) + data.length;
    UnsignedInteger.ensureUint32(newSegmentSize);

    this.segmentSizes.set(address.getSegmentIndex(), newSegmentSize);

    return address.add(data.length);
  }

  // Insert a value in the memory at the given address and increase
  // the segment size by 1.
  insert(address: Relocatable, value: MaybeRelocatable): void {
    this.insert_inner(address, value);
    if (address.getOffset() > this.getSegmentSize(address.getSegmentIndex())) {
      UnsignedInteger.ensureUint32(address.getOffset() + 1);
      this.segmentSizes.set(address.getSegmentIndex(), address.getOffset() + 1);
    }
  }

  private insert_inner(address: Relocatable, value: MaybeRelocatable): void {
    if (address.getSegmentIndex() >= this.memory.getNumSegments()) {
      throw new MemoryError(SegmentError);
    }

    const addressString = `${address.getSegmentIndex()}:${address.getOffset()}`;
    if (this.memory.data.get(addressString) !== undefined) {
      throw new MemoryError(WriteOnceError);
    }
    this.memory.data.set(addressString, value);
  }

  getSegmentSize(segmentIndex: number): number {
    return this.segmentSizes.get(segmentIndex) ?? 0;
  }
}
