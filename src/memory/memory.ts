import { InconsistentMemory, SegmentOutOfBounds } from 'errors/memory';

import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';

export class Memory {
  values: Array<Array<SegmentValue>>;

  constructor() {
    this.values = [];
  }

  get(address: Relocatable): SegmentValue | undefined {
    const segmentNumber = this.getSegmentNumber();
    if (address.segment >= segmentNumber) {
      throw new SegmentOutOfBounds(address.segment, segmentNumber);
    }
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
    this.values[segment][offset] = this.get(address) ?? value;
    if (this.values[segment][offset] !== value) {
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

  toString(): string {
    return [
      '\nMEMORY',
      'Address  ->  Value',
      '-----------------',
      ...this.values.map((segment, index) =>
        segment.map(
          (value, offset) => `${index}:${offset} -> ${value.toString()}`
        )
      ),
    ]
      .flat()
      .join('\n');
  }
}
