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
      const sum = address.add(UnsignedInteger.toUint32(index));
      if (sum.isErr()) {
        return sum;
      }
      const insertResult = this.memory.insert(sum.unwrap(), data[index]);
      if (insertResult.isErr()) {
        return insertResult;
      }
    }

    const segmentSize = UnsignedInteger.toUint32(data.length);
    this.segmentSizes.set(address.getSegmentIndex(), segmentSize);

    return address.add(segmentSize);
  }

  getSegmentSize(segmentIndex: Uint32): Uint32 {
    return this.segmentSizes.get(segmentIndex) ?? UnsignedInteger.toUint32(0);
  }
}
