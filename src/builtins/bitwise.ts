import { Memory, Segment } from 'memory/memory';
import { BuiltinRunnerBase } from './builtin';
import { SegmentValue, isFelt } from 'primitives/segmentValue';
import { CannotInferValue, UndefinedValue } from 'errors/builtins';
import { ExpectedFelt } from 'errors/virtualMachine';
import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';

export class Bitwise extends BuiltinRunnerBase {
  static readonly cellsPerBitwise = 5;
  static readonly inputCellsPerBitwise = 2;

  /* Perform bitwise operations and, or & xor */
  infer(segment: Segment, address: Relocatable): SegmentValue | undefined {
    const { segmentId, offset } = address;
    const bitwiseIndex = offset % Bitwise.cellsPerBitwise;
    if (bitwiseIndex < Bitwise.inputCellsPerBitwise) {
      throw new CannotInferValue(address);
    }

    const xOffset = offset - bitwiseIndex;
    const xValue = segment.values[xOffset];
    if (!xValue) throw new UndefinedValue(xOffset);
    if (!isFelt(xValue)) throw new ExpectedFelt();
    const x = xValue.toBigInt();

    const yOffset = xOffset + 1;
    const yValue = segment.values[yOffset];
    if (!yValue) throw new UndefinedValue(yOffset);
    if (!isFelt(yValue)) throw new ExpectedFelt();
    const y = yValue.toBigInt();

    switch (bitwiseIndex) {
      case 2:
        const addressAND = new Relocatable(segmentId, xOffset + 2);
        segment.assertEq(addressAND, new Felt(x & y));
        break;
      case 3:
        const addressXOR = new Relocatable(segmentId, xOffset + 3);
        segment.assertEq(addressXOR, new Felt(x ^ y));
        break;
      case 4:
        const addressOR = new Relocatable(segmentId, xOffset + 4);
        segment.assertEq(addressOR, new Felt(x | y));
        break;
    }
    return segment.values[offset];
  }

  toString(): string {
    return 'Bitwise builtin';
  }
}
