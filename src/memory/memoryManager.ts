import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Memory } from './memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Result } from 'result/result';

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
    data.forEach((d, index) => {
      const { value: indexUint, error: indexError } =
        UnsignedInteger.toUint32(index);
      if (indexError !== undefined) {
        return { value: undefined, error: indexError };
      }
      const { value: nextAddress, error: addrError } = address.add(indexUint);
      if (addrError !== undefined) {
        return { value: undefined, error: addrError };
      }
      this.memory.insert(nextAddress, d);
    });

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

  getSegmentSize(segmentIndex: Uint32): Uint32 {
    return this.segmentSizes.get(segmentIndex) ?? UnsignedInteger.ZERO_UINT32;
  }
}
