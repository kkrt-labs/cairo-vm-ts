import { isFelt } from 'primitives/segmentValue';
import { BuiltinHandler } from './builtin';
import { ExpectedFelt } from 'errors/primitives';
import { ExpectedOffset } from 'errors/builtins';

export const outputHandler: BuiltinHandler = {
  set(target, prop, newValue): boolean {
    if (isNaN(Number(prop))) throw new ExpectedOffset(prop);
    if (!isFelt(newValue)) throw new ExpectedFelt(newValue);

    const offset = Number(prop);
    target[offset] = newValue;

    return true;
  },
};
