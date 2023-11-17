import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Memory } from './memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Result } from 'result/result';
import { MemoryError, WriteOnceError } from 'result/memory';
import { SegmentError } from 'result/primitives';

export class MemorySegmentManager {
  private segmentSizes: Map<Uint32, Uint32>;
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

  loadData(
    address: Relocatable,
    data: MaybeRelocatable[]
  ): Result<Relocatable> {
    for (const [index, d] of data.entries()) {
      const { value: indexUint, error: indexError } =
        UnsignedInteger.toUint32(index);
      if (indexError !== undefined) {
        return { value: undefined, error: indexError };
      }
      const { value: nextAddress, error: addrError } = address.add(indexUint);
      if (addrError !== undefined) {
        return { value: undefined, error: addrError };
      }
      this.insert_inner(nextAddress, d);
    }

    const { value: dataLen, error: dataLenError } = UnsignedInteger.toUint32(
      data.length
    );
    if (dataLenError !== undefined) {
      return { value: undefined, error: dataLenError };
    }

    const { value: newSegmentSize, error: segmentSizeError } =
      UnsignedInteger.toUint32(
        this.getSegmentSize(address.getSegmentIndex()) + dataLen
      );
    if (segmentSizeError !== undefined) {
      return { value: undefined, error: segmentSizeError };
    }
    this.segmentSizes.set(address.getSegmentIndex(), newSegmentSize);

    return address.add(dataLen);
  }

  // Insert a value in the memory at the given address and increase
  // the segment size by 1.
  insert(address: Relocatable, value: MaybeRelocatable): void {
    this.insert_inner(address, value);
    if (address.getOffset() > this.getSegmentSize(address.getSegmentIndex())) {
      const { value: newSize, error } = UnsignedInteger.toUint32(
        address.getOffset() + UnsignedInteger.ONE_UINT32
      );
      if (error !== undefined) {
        throw error;
      }
      this.segmentSizes.set(address.getSegmentIndex(), newSize);
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

  getSegmentSize(segmentIndex: Uint32): Uint32 {
    return this.segmentSizes.get(segmentIndex) ?? UnsignedInteger.ZERO_UINT32;
  }
}
