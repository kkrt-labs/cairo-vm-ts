import { Result, VMError } from '../result-pattern/result';
import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from 'primitives/relocatable';
import { Uint, UnsignedInteger } from 'primitives/uint';

export class MemoryError extends Error {}

export const UnknownAddressError = {
  message:
    'MemoryError: tried to access memory at unknown or uninitialized address',
};

export const WriteOnceError = {
  message:
    'MemoryError: tried to write exisiting memory. Can only write to memory once.',
};

export class Memory {
  data: Map<Relocatable, MaybeRelocatable>;
  numSegments: Uint;

  constructor() {
    this.data = new Map();
    this.numSegments = UnsignedInteger.toUint(0);
  }

  insert(address: Relocatable, value: MaybeRelocatable): Result<true, VMError> {
    if (address.getSegmentIndex() >= this.numSegments) {
      return Result.error(SegmentError);
    }

    if (this.data.get(address) !== undefined) {
      return Result.error(WriteOnceError);
    }

    this.data.set(address, value);
    return Result.ok(true);
  }

  get(address: Relocatable): Result<MaybeRelocatable, VMError> {
    const value = this.data.get(address);
    if (value === undefined) {
      return Result.error(UnknownAddressError);
    }
    return Result.ok(value);
  }
}

export class MemorySegmentManager {
  segmentSizes: Record<Uint, Uint>;
  memory: Memory;

  constructor() {
    this.segmentSizes = {};
    this.memory = new Memory();
  }

  addSegment(): Relocatable {
    const ptr = new Relocatable(this.memory.numSegments, 0);
    this.memory.numSegments = UnsignedInteger.toUint(
      this.memory.numSegments + 1
    );
    return ptr;
  }

  loadData(
    address: Relocatable,
    data: MaybeRelocatable[]
  ): Result<Relocatable, VMError> {
    for (let index = 0; index < data.length; index++) {
      const sum = address.add(UnsignedInteger.toUint(index));
      if (sum.isErr()) {
        return sum;
      }
      const insertResult = this.memory.insert(sum.unwrap(), data[index]);
      if (insertResult.isErr()) {
        return insertResult;
      }
    }
    return address.add(UnsignedInteger.toUint(data.length));
  }
}
