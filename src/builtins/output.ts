import { isFelt } from 'primitives/segmentValue';
import { BuiltinHandler } from './builtin';
import { ExpectedFelt } from 'errors/virtualMachine';
import { ExpectedOffset } from 'errors/builtins';

export const outputHandler: BuiltinHandler = {
  set(target, prop, newValue): boolean {
    if (isNaN(Number(prop))) throw new ExpectedOffset();
    if (!isFelt(newValue)) throw new ExpectedFelt();

    const offset = Number(prop);
    target[offset] = newValue;

    return true;
  },
};
