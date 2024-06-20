import { ExpectedFelt } from 'errors/primitives';
import { UndefinedValue } from 'errors/builtins';

import { Felt } from 'primitives/felt';
import { isFelt } from 'primitives/segmentValue';
import { BuiltinHandler } from './builtin';

export const bitwiseHandler: BuiltinHandler = {
  get(target, prop) {
    if (isNaN(Number(prop))) {
      return Reflect.get(target, prop);
    }

    const cellsPerBitwise = 5;
    const inputCellsPerBitwise = 2;

    const offset = Number(prop);
    const bitwiseIndex = offset % cellsPerBitwise;
    if (bitwiseIndex < inputCellsPerBitwise || target[offset]) {
      return target[offset];
    }

    const xOffset = offset - bitwiseIndex;
    const xValue = target[xOffset];
    if (!xValue) throw new UndefinedValue(xOffset);
    if (!isFelt(xValue)) throw new ExpectedFelt(xValue);
    const x = xValue.toBigInt();

    const yOffset = xOffset + 1;
    const yValue = target[yOffset];
    if (!yValue) throw new UndefinedValue(yOffset);
    if (!isFelt(yValue)) throw new ExpectedFelt(yValue);
    const y = yValue.toBigInt();

    switch (bitwiseIndex) {
      case 2:
        target[offset] = new Felt(x & y);
        break;
      case 3:
        target[offset] = new Felt(x ^ y);
        break;
      case 4:
        target[offset] = new Felt(x | y);
        break;
    }
    return target[offset];
  },
};
