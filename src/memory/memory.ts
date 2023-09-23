import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from './primitives/relocatable';
import { Uint, UnsignedInteger } from './primitives/uint';

export class MemoryError extends Error {}
export class WriteOnceError extends MemoryError {}
export class UnknownAddressError extends MemoryError {}

export class Memory {
  data: Map<Relocatable, MaybeRelocatable>;
  numSegments: Uint;

  constructor() {
    this.data = new Map();
    this.numSegments = UnsignedInteger.toUint(0);
  }

  insert(address: Relocatable, value: MaybeRelocatable) {
    if (address.getSegmentIndex() >= this.numSegments) {
      throw new SegmentError();
    }

    if (this.data.get(address) !== undefined) {
      throw new WriteOnceError();
    }

    this.data.set(address, value);
  }

  get(address: Relocatable): MaybeRelocatable {
    const value = this.data.get(address);
    if (value === undefined) {
      throw new UnknownAddressError();
    }
    return value;
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

  loadData(address: Relocatable, data: MaybeRelocatable[]): Relocatable {
    data.forEach((d, index) =>
      this.memory.insert(address.add(UnsignedInteger.toUint(index)), d)
    );
    return address.add(UnsignedInteger.toUint(data.length));
  }
}
