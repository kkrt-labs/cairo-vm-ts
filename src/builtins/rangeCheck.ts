import { ExpectedOffset, RangeCheckOutOfBounds } from 'errors/builtins';
import { BuiltinHandler } from './builtin';
import { isFelt } from 'primitives/segmentValue';
import { ExpectedFelt } from 'errors/virtualMachine';

const rangeCheckHandlerFactory = (boundExponent: bigint): BuiltinHandler => {
  return {
    set(target, prop, newValue): boolean {
      if (isNaN(Number(prop))) throw new ExpectedOffset();

      const offset = Number(prop);
      if (!isFelt(newValue)) throw new ExpectedFelt();
      if (newValue.toBigInt() >> boundExponent !== 0n)
        throw new RangeCheckOutOfBounds();

      target[offset] = newValue;
      return true;
    },
  };
};

export const rangeCheckHandler = rangeCheckHandlerFactory(128n);
export const rangeCheck96Handler = rangeCheckHandlerFactory(96n);
