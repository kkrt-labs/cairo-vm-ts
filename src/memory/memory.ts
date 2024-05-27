import { InconsistentMemory, SegmentOutOfBounds } from 'errors/memory';

import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';
import { BuiltinRunner, NoBuiltin } from 'builtins/builtin';

export class Segment {
  builtin: BuiltinRunner;
  values: Array<SegmentValue>;

  constructor(builtin: BuiltinRunner = new NoBuiltin()) {
    this.builtin = builtin;
    this.values = [];
  }

  get(address: Relocatable): SegmentValue | undefined {
    return this.values[address.offset] ?? this.builtin.infer(this, address);
  }

  assertEq(address: Relocatable, value: SegmentValue): void {
    const { offset } = address;
    this.values[offset] = this.values[offset] ?? value;

    if (this.values[offset] !== value) {
      throw new InconsistentMemory(address, this.values[offset], value);
    }
    this.builtin.validate(this);
  }
}

export class Memory {
  segments: Array<Segment>;

  constructor() {
    this.segments = [];
  }

  get(address: Relocatable): SegmentValue | undefined {
    const segmentNumber = this.getSegmentNumber();
    if (address.segment >= segmentNumber) {
      throw new SegmentOutOfBounds(address.segment, segmentNumber);
    }
    return this.segments[address.segment].get(address);
  }

  addSegment(builtin?: BuiltinRunner): Relocatable {
    this.segments.push(new Segment(builtin));
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
    if (address.segment >= segmentNumber) {
      throw new SegmentOutOfBounds(address.segment, segmentNumber);
    }
    this.segments[address.segment].assertEq(address, value);
  }

  getSegmentSize(segment: number): number {
    return this.segments[segment].values.length ?? 0;
  }

  toString(): string {
    return [
      '\nMEMORY',
      'Address  ->  Value',
      '-----------------',
      ...this.segments.map((segment, index) =>
        segment.values.map(
          (value, offset) => `${index}:${offset} -> ${value.toString()}`
        )
      ),
    ]
      .flat()
      .join('\n');
  }
}
