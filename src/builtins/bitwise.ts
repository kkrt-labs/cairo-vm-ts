import { isFelt } from 'primitives/segmentValue';
import { UndefinedValue } from 'errors/builtins';
import { ExpectedFelt } from 'errors/virtualMachine';
import { Felt } from 'primitives/felt';
import { BuiltinHandler } from './builtin';

export const bitwiseHandler: BuiltinHandler = {
  get(target, prop) {
    const cellsPerBitwise = 5;
    const inputCellsPerBitwise = 2;

    const offset = Number(prop);
    const bitwiseIndex = offset % cellsPerBitwise;
    if (bitwiseIndex < inputCellsPerBitwise) {
      return target[offset];
    }

    const xOffset = offset - bitwiseIndex;
    const xValue = target[xOffset];
    if (!xValue) throw new UndefinedValue(xOffset);
    if (!isFelt(xValue)) throw new ExpectedFelt();
    const x = xValue.toBigInt();

    const yOffset = xOffset + 1;
    const yValue = target[yOffset];
    if (!yValue) throw new UndefinedValue(yOffset);
    if (!isFelt(yValue)) throw new ExpectedFelt();
    const y = yValue.toBigInt();

    switch (bitwiseIndex) {
      case 2:
        target[xOffset + 2] = new Felt(x & y);
        break;
      case 3:
        target[xOffset + 3] = new Felt(x ^ y);
        break;
      case 4:
        target[xOffset + 4] = new Felt(x | y);
        break;
    }
    return target[offset];
  },
};
