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
      const indexResult = UnsignedInteger.toUint32(index);
      if (indexResult.isErr()) {
        return indexResult;
      }
      const next_address = address.add(indexResult.unwrap());
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

    const dataLenResult = UnsignedInteger.toUint32(data.length);
    if (dataLenResult.isErr()) {
      return dataLenResult;
    }
    const dataLen = dataLenResult.unwrap();

    const newSegmentSizeResult = UnsignedInteger.toUint32(
      this.getSegmentSize(address.getSegmentIndex()) + dataLen
    );
    if (newSegmentSizeResult.isErr()) {
      return newSegmentSizeResult;
    }
    this.segmentSizes.set(
      address.getSegmentIndex(),
      newSegmentSizeResult.unwrap()
    );

    return address.add(dataLen);
  }

  getSegmentSize(segmentIndex: Uint32): Uint32 {
    return this.segmentSizes.get(segmentIndex) ?? UnsignedInteger.ZERO;
  }
}
