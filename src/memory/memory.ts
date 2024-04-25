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
      this.write(address.add(index), value);
    });
  }

  /**
   * Read the value constrained at `address` and check the consistency of `value`
   * @param address
   * @param value Value expected to be read at `address`
   *
   * NOTE: Cairo memory is Nondeterministic-Read-Only.
   *
   * The VM doesn't actually write to the memory, but the prover does, once.
   * Memory cell values are constrained as the program is executed:
   * - If the cell at `address` is `undefined`, then the first call to `read(address, value)`
   * constrains `address` to `value`
   * - If the cell at `address` already has a value, it cannot be changed, only read. Further calls `
   */
  write(address: Relocatable, value: MaybeRelocatable): void {
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
      throw new InconsistentMemory(this.data[segment][offset], value);
    }
  }

  getSegmentSize(segment: number): number {
    return this.data[segment]?.length ?? 0;
  }
}
