import { InconsistentMemory, SegmentOutOfBounds } from 'errors/memory';

import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';
import { BuiltinHandler } from 'builtins/builtin';

export class Memory {
  segments: Array<Array<SegmentValue>>;

  constructor() {
    this.segments = [];
  }

  get(address: Relocatable): SegmentValue | undefined {
    const segmentNumber = this.getSegmentNumber();
    if (address.segmentId >= segmentNumber) {
      throw new SegmentOutOfBounds(address.segmentId, segmentNumber);
    }
    return this.segments[address.segmentId][address.offset];
  }

  addSegment(builtin: BuiltinHandler = {}): Relocatable {
    const segment = new Proxy(new Array<SegmentValue>(), builtin);
    this.segments.push(segment);
    return new Relocatable(this.segments.length - 1, 0);
  }

  getSegmentNumber(): number {
    return this.segments.length;
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
    const segmentNumber = this.getSegmentNumber();
    const { segmentId, offset } = address;
    if (segmentId >= segmentNumber) {
      throw new SegmentOutOfBounds(segmentId, segmentNumber);
    }

    this.segments[segmentId][offset] =
      this.segments[segmentId][offset] ?? value;

    if (!this.segments[segmentId][offset].eq(value)) {
      throw new InconsistentMemory(
        offset,
        this.segments[segmentId][offset],
        value
      );
    }
    this.segments[address.segmentId][address.offset] = value;
  }

  getSegmentSize(segment: number): number {
    return this.segments[segment].length ?? 0;
  }

  toString(): string {
    return [
      '\nMEMORY',
      'Address  ->  Value',
      '-----------------',
      ...this.segments.map((segment, index) =>
        segment.map(
          (value, offset) => `${index}:${offset} -> ${value.toString()}`
        )
      ),
    ]
      .flat()
      .join('\n');
  }
}
