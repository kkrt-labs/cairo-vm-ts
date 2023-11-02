import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Memory } from './memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';

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

  loadData(address: Relocatable, data: MaybeRelocatable[]): Relocatable {
    for (let index = 0; index < data.length; index++) {
      const indexUint = UnsignedInteger.toUint32(index);
      const next_address = address.add(indexUint);
      this.memory.insert(next_address, data[index]);
    }

    let dataLen = UnsignedInteger.toUint32(data.length);

    const newSegmentSize = UnsignedInteger.toUint32(
      this.getSegmentSize(address.getSegmentIndex()) + dataLen
    );
    this.segmentSizes.set(address.getSegmentIndex(), newSegmentSize);

    return address.add(dataLen);
  }

  getSegmentSize(segmentIndex: Uint32): Uint32 {
    return this.segmentSizes.get(segmentIndex) ?? UnsignedInteger.ZERO_UINT32;
  }
}
