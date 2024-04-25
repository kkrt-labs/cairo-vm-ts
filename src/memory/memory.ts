import { SegmentOutOfBounds, WriteOnceError } from 'errors/memory';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';

export class Memory {
  data: Array<Array<MaybeRelocatable>>;

  constructor() {
    this.data = [[]];
  }

  get(address: Relocatable): MaybeRelocatable | undefined {
    return this.data[address.segment][address.offset];
  }

  addSegment(): Relocatable {
    this.data.push([]);
    return new Relocatable(this.data.length - 1, 0);
  }

  getSegmentNumber(): number {
    return this.data.length;
  }

  setData(address: Relocatable, data: MaybeRelocatable[]): void {
    data.forEach((value, index) => {
      this.write(address.add(index), value);
    });
  }

  // Insert a value in the memory at the given address and increase
  // the segment size by 1.
  write(address: Relocatable, value: MaybeRelocatable): void {
    if (address.segment >= this.getSegmentNumber()) {
      throw new SegmentOutOfBounds(address.segment, this.getSegmentNumber());
    }
    if (this.data[address.segment][address.offset] !== undefined) {
      throw new WriteOnceError();
    }
    this.data[address.segment][address.offset] = value;
  }

  getSegmentSize(segment: number): number {
    return this.data[segment]?.length ?? 0;
  }
}
