import { InconsistentMemory, SegmentOutOfBounds } from 'errors/memory';
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
      this.assertEq(address.add(index), value);
    });
  }

  /**
   * Assert that the memory cell at `address` equals `value`.
   * - If `address` is undefined, the memory cell is replaced by `value` - Happens only once.
   * - Any further call to `address` with `newValue` will throw if `newValue !== value`.
   *
   * @param address Memory cell
   * @param value Value to assert at `address`
   *
   * NOTE: Cairo memory follows a Nondeterministic-Read-Only model.
   *
   * NOTE2: Method equivalent to `insert()` in the rust cairo-vm
   * and `__setitem__()` in the python cairo-vm
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
