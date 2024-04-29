import { InconsistentMemory, SegmentOutOfBounds } from 'errors/memory';
import { Relocatable } from 'primitives/relocatable';
import { MaybeRelocatable } from 'primitives/maybeRelocatable';

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
      this.assertEq(address.add(index), value);
    });
  }

  /**
   * @param address
   * @param value
   *
   * @dev if memory at `address` is undefined, it is set to `value`
   */
  assertEq(address: Relocatable, value: MaybeRelocatable): void {
    const { segment, offset } = address;
    const segmentNumber = this.getSegmentNumber();

    if (segment >= segmentNumber) {
      throw new SegmentOutOfBounds(segment, segmentNumber);
    }

    const currentValue: MaybeRelocatable | undefined =
      this.data[segment][offset];

    if (currentValue === undefined) {
      this.data[segment][offset] = value;
    } else if (currentValue !== value) {
      throw new InconsistentMemory(address, this.data[segment][offset], value);
    }
  }

  getSegmentSize(segment: number): number {
    return this.data[segment]?.length ?? 0;
  }
}
