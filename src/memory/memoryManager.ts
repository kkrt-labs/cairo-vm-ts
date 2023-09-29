import { Uint64, UnsignedInteger } from 'primitives/uint';
import { Memory } from './memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Result, VMError } from 'result-pattern/result';

export class MemorySegmentManager {
  private segmentSizes: Map<Uint64, Uint64>;
  memory: Memory;

  constructor() {
    this.segmentSizes = new Map();
    this.memory = new Memory();
  }

  addSegment(): Relocatable {
    const ptr = new Relocatable(this.memory.getNumSegments(), 0n);
    this.memory.incrementNumSegments();
    return ptr;
  }

  loadData(
    address: Relocatable,
    data: MaybeRelocatable[]
  ): Result<Relocatable, VMError> {
    for (let index = 0; index < data.length; index++) {
      const sum = address.add(UnsignedInteger.toUint64(BigInt(index)));
      if (sum.isErr()) {
        return sum;
      }
      const insertResult = this.memory.insert(sum.unwrap(), data[index]);
      if (insertResult.isErr()) {
        return insertResult;
      }
    }

    const segmentSize = UnsignedInteger.toUint64(BigInt(data.length));
    this.segmentSizes.set(address.getSegmentIndex(), segmentSize);

    return address.add(segmentSize);
  }

  getSegmentSize(segmentIndex: Uint64): Uint64 {
    return this.segmentSizes.get(segmentIndex) || UnsignedInteger.toUint64(0n);
  }
}
