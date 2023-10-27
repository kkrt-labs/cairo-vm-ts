import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Memory } from './memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Result, VMError } from 'result-pattern/result';

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
  ): Result<Relocatable, VMError> {
    for (let index = 0; index < data.length; index++) {
      const indexUint = UnsignedInteger.toUint32(index);
      if (indexUint.isErr()) {
        return indexUint;
      }
      const next_address = address.add(indexUint.unwrap());
      if (next_address.isErr()) {
        return next_address;
      }
      const insert = this.memory.insert(next_address.unwrap(), data[index]);
      if (insert.isErr()) {
        return insert;
      }
    }

    let dataLen = UnsignedInteger.toUint32(data.length);
    if (dataLen.isErr()) {
      return dataLen;
    }

    const newSegmentSize = UnsignedInteger.toUint32(
      this.getSegmentSize(address.getSegmentIndex()) + dataLen.unwrap()
    );
    if (newSegmentSize.isErr()) {
      return newSegmentSize;
    }
    this.segmentSizes.set(address.getSegmentIndex(), newSegmentSize.unwrap());

    return address.add(dataLen.unwrap());
  }

  getSegmentSize(segmentIndex: Uint32): Uint32 {
    return this.segmentSizes.get(segmentIndex) ?? UnsignedInteger.ZERO_UINT32;
  }
}
