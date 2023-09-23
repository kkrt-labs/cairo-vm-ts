import { Uint64, UnsignedInteger } from 'primitives/uint';
import { Memory } from './memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Result, VMError } from 'result-pattern/result';

export class MemorySegmentManager {
  segmentSizes: Record<number, Uint64>;
  memory: Memory;

  constructor() {
    this.segmentSizes = {};
    this.memory = new Memory();
  }

  addSegment(): Relocatable {
    const ptr = new Relocatable(this.memory.numSegments, 0n);
    this.memory.numSegments = UnsignedInteger.toUint64(
      this.memory.numSegments + 1n
    );
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
    return address.add(UnsignedInteger.toUint64(BigInt(data.length)));
  }
}
