import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { resOp, ResOp } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { isFelt, isRelocatable } from 'primitives/segmentValue';
import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';

/** Zod object to parse Felt252DictUpdate hint */
export const felt252DictUpdateParser = z
  .object({
    Felt252DictUpdate: z.object({
      dict_ptr: resOp,
      value: resOp,
    }),
  })
  .transform(({ Felt252DictUpdate: { dict_ptr, value } }) => ({
    type: HintName.Felt252DictUpdate,
    dictPtr: dict_ptr,
    value,
  }));

/**
 * Felt252DictUpdate hint
 *
 * Set a value in a dict: `dict[key] = value`
 */
export type Felt252DictUpdate = z.infer<typeof felt252DictUpdateParser>;

/**
 * Get the dictionnary `dict` at `dictPtr`
 *
 * Get the key at address `dict - 3`
 *
 * `dict[key] = value`
 *
 */
export const felt252DictUpdate = (
  vm: VirtualMachine,
  dictPtr: ResOp,
  value: ResOp
) => {
  const address = vm.getPointer(...vm.extractBuffer(dictPtr));
  const keyAddr = vm.memory.get(address.sub(3));
  if (!keyAddr || !isRelocatable(keyAddr))
    throw new ExpectedRelocatable(keyAddr);
  const key = vm.memory.get(keyAddr);
  if (!key || !isFelt(key)) throw new ExpectedFelt(key);
  const val = vm.getResOperandValue(value);
  const dict = vm.getDict(address);
  dict.set(key, val);
};
