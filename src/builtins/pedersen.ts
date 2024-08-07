import { UndefinedValue } from 'errors/builtins';
import { BuiltinHandler } from './builtin';
import { ExpectedFelt } from 'errors/primitives';
import { isFelt } from 'primitives/segmentValue';
import { pedersen } from '@scure/starknet';
import { Felt } from 'primitives/felt';

/** Total number of cells per pedersen operation */
export const CELLS_PER_PEDERSEN = 3;

/** Number of input cells for a pedersen operation */
export const INPUT_CELLS_PER_PEDERSEN = 2;

/** Pedersen Builtin - Computes Pedersen(x, y) */
export const pedersenHandler: BuiltinHandler = {
  get(target, prop) {
    if (isNaN(Number(prop))) {
      return Reflect.get(target, prop);
    }

    const offset = Number(prop);
    const pedersenIndex = offset % CELLS_PER_PEDERSEN;
    if (pedersenIndex < INPUT_CELLS_PER_PEDERSEN || target[offset]) {
      return target[offset];
    }

    const xOffset = offset - pedersenIndex;
    const xValue = target[xOffset];
    if (!xValue) throw new UndefinedValue(xOffset);
    if (!isFelt(xValue)) throw new ExpectedFelt(xValue);
    const x = xValue.toBigInt();

    const yOffset = xOffset + 1;
    const yValue = target[yOffset];
    if (!yValue) throw new UndefinedValue(yOffset);
    if (!isFelt(yValue)) throw new ExpectedFelt(yValue);
    const y = yValue.toBigInt();

    return (target[offset] = new Felt(BigInt(pedersen(x, y))));
  },
};
