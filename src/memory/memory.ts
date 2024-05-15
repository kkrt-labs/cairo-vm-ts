import { InconsistentMemory, SegmentOutOfBounds } from 'errors/memory';

import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';

export class Memory {
  values: Array<Array<SegmentValue>>;

  constructor() {
    this.values = [[]];
  }

  get(address: Relocatable): SegmentValue | undefined {
    return this.values[address.segment][address.offset];
  }

  addSegment(): Relocatable {
    this.values.push([]);
    return new Relocatable(this.values.length - 1, 0);
  }

  getSegmentNumber(): number {
    return this.values.length;
  }

  setValues(address: Relocatable, values: SegmentValue[]): void {
    values.forEach((value, index) => {
      this.assertEq(address.add(index), value);
    });
  }

  /**
   * @param address
   * @param value
   *
   * @dev if memory at `address` is undefined, it is set to `value`
   */
  assertEq(address: Relocatable, value: SegmentValue): void {
    const { segment, offset } = address;
    const segmentNumber = this.getSegmentNumber();

    if (segment >= segmentNumber) {
      throw new SegmentOutOfBounds(segment, segmentNumber);
    }

    const currentValue: SegmentValue | undefined = this.values[segment][offset];

    if (currentValue === undefined) {
      this.values[segment][offset] = value;
    } else if (currentValue !== value) {
      throw new InconsistentMemory(
        address,
        this.values[segment][offset],
        value
      );
    }
  }

  getSegmentSize(segment: number): number {
    return this.values[segment]?.length ?? 0;
  }
}
