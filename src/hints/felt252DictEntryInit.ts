import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { resOp, ResOp } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { Felt } from 'primitives/felt';

/** Zod object to parse Felt252DictEntryInit hint */
export const felt252DictEntryInitParser = z
  .object({
    Felt252DictEntryInit: z.object({
      dict_ptr: resOp,
      key: resOp,
    }),
  })
  .transform(({ Felt252DictEntryInit: { dict_ptr, key } }) => ({
    type: HintName.Felt252DictEntryInit,
    dictPtr: dict_ptr,
    key,
  }));

/**
 * Felt252DictEntryInit hint
 *
 * Initialize the entry to be added to a given dictionnary.
 */
export type Felt252DictEntryInit = z.infer<typeof felt252DictEntryInitParser>;

/**
 * Get the dictionnary `dict` at `dictPtr`
 * Get the `key` to be initialized
 *
 * Read the current value at `key` if any,
 * Initialize `dict[key]` to 0 if undefined.
 *
 * Assert the value at key to the `dict` segment.
 *
 */
export const felt252DictEntryInit = (
  vm: VirtualMachine,
  dictPtr: ResOp,
  key: ResOp
) => {
  const address = vm.getPointer(...vm.extractBuffer(dictPtr));
  const keyValue = vm.getResOperandValue(key);
  const dict = vm.getDict(address);
  const prevValue = dict.get(keyValue) || new Felt(0n);
  dict.set(keyValue, prevValue);
  vm.memory.assertEq(address.add(1), prevValue);
};
