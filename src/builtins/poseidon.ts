import { UndefinedValue } from 'errors/builtins';
import { BuiltinHandler } from './builtin';
import { ExpectedFelt } from 'errors/virtualMachine';
import { isFelt } from 'primitives/segmentValue';
import { poseidonSmall } from '@scure/starknet';
import { Felt } from 'primitives/felt';

const poseidon = (x: bigint, y: bigint, z: bigint) => poseidonSmall([x, y, z]);

/** Poseidon Builtin - Computes state of Poseidon(x, y)
 * Input: Initial state as 3 memory cells
 * Output: Updated state as 3 memory cells
 */
export const poseidonHandler: BuiltinHandler = {
  get(target, prop) {
    if (isNaN(Number(prop))) {
      return Reflect.get(target, prop);
    }

    const cellsPerPoseidon = 6;
    const inputCellsPerPoseidon = 3;

    const offset = Number(prop);
    const poseidonIndex = offset % cellsPerPoseidon;
    if (poseidonIndex < inputCellsPerPoseidon || target[offset]) {
      return target[offset];
    }

    const xOffset = offset - poseidonIndex;
    const xValue = target[xOffset];
    if (!xValue) throw new UndefinedValue(xOffset);
    if (!isFelt(xValue)) throw new ExpectedFelt();
    const x = xValue.toBigInt();

    const yOffset = xOffset + 1;
    const yValue = target[yOffset];
    if (!yValue) throw new UndefinedValue(yOffset);
    if (!isFelt(yValue)) throw new ExpectedFelt();
    const y = yValue.toBigInt();

    const zOffset = xOffset + 2;
    const zValue = target[zOffset];
    if (!zValue) throw new UndefinedValue(zOffset);
    if (!isFelt(zValue)) throw new ExpectedFelt();
    const z = zValue.toBigInt();

    const state = poseidon(x, y, z);

    return (target[offset] = new Felt(
      state[poseidonIndex - inputCellsPerPoseidon]
    ));
  },
};
