import { UndefinedValue } from 'errors/builtins';
import { BuiltinHandler } from './builtin';
import { ExpectedFelt } from 'errors/virtualMachine';
import { isFelt } from 'primitives/segmentValue';
import { pedersen } from '@scure/starknet';
import { Felt } from 'primitives/felt';

/** Pedersen Builtin - Computes Pedersen(x, y) */
export const pedersenHandler: BuiltinHandler = {
  get(target, prop) {
    if (isNaN(Number(prop))) {
      return Reflect.get(target, prop);
    }

    const cellsPerPedersen = 3;
    const inputCellsPerPedersen = 2;

    const offset = Number(prop);
    const pedersenIndex = offset % cellsPerPedersen;
    if (target[offset] || pedersenIndex < inputCellsPerPedersen) {
      return target[offset];
    }

    const xOffset = offset - pedersenIndex;
    const xValue = target[xOffset];
    if (!xValue) throw new UndefinedValue(xOffset);
    if (!isFelt(xValue)) throw new ExpectedFelt();
    const x = xValue.toBigInt();

    const yOffset = xOffset + 1;
    const yValue = target[yOffset];
    if (!yValue) throw new UndefinedValue(yOffset);
    if (!isFelt(yValue)) throw new ExpectedFelt();
    const y = yValue.toBigInt();

    return (target[offset] = new Felt(BigInt(pedersen(x, y))));
  },
};
