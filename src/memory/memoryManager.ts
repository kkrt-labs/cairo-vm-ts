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
      const next_address = address.add(UnsignedInteger.toUint32(index));
      if (next_address.isErr()) {
        return next_address;
      }
      const insertResult = this.memory.insert(
        next_address.unwrap(),
        data[index]
      );
      if (insertResult.isErr()) {
        return insertResult;
      }
    }

    const dataLen = UnsignedInteger.toUint32(data.length);

    const newSegmentSize =
      this.getSegmentSize(address.getSegmentIndex()) + dataLen;
    this.segmentSizes.set(
      address.getSegmentIndex(),
      UnsignedInteger.toUint32(newSegmentSize)
    );

    return address.add(dataLen);
  }

  getSegmentSize(segmentIndex: Uint32): Uint32 {
    return this.segmentSizes.get(segmentIndex) ?? UnsignedInteger.toUint32(0);
  }
}
