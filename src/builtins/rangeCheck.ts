import { ExpectedOffset, RangeCheckOutOfBounds } from 'errors/builtins';
import { BuiltinHandler } from './builtin';
import { isFelt } from 'primitives/segmentValue';
import { ExpectedFelt } from 'errors/virtualMachine';

export const rangeCheckHandler: BuiltinHandler = {
  set(target, prop, newValue): boolean {
    if (isNaN(Number(prop))) throw new ExpectedOffset();

    const offset = Number(prop);
    if (!isFelt(newValue)) throw new ExpectedFelt();
    if (newValue.toBigInt() >> 128n !== 0n) throw new RangeCheckOutOfBounds();

    target[offset] = newValue;

    return true;
  },
};
