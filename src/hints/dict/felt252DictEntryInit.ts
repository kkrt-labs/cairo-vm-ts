import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { resOperand, ResOperand } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse Felt252DictEntryInit hint */
export const felt252DictEntryInitParser = z
  .object({
    Felt252DictEntryInit: z.object({
      dict_ptr: resOperand,
      key: resOperand,
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
  dictPtr: ResOperand,
  key: ResOperand
) => {
  const address = vm.getPointer(...vm.extractBuffer(dictPtr));
  const keyValue = vm.getResOperandValue(key).toString();
  const dict = vm.getDict(address);
  const prevValue = dict.get(keyValue) || new Felt(0n);
  dict.set(keyValue, prevValue);
  vm.memory.assertEq(address.add(1), prevValue);
};
