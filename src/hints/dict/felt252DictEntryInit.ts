import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { resOperand, ResOperand } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { PREV_VALUE_OFFSET } from 'hints/dictionary';

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
 * Initializes a dictionary access by asserting that
 * the previous value cell holds the current value
 * of the dictionary (initialized to zero if undefined).
 *
 */
export type Felt252DictEntryInit = z.infer<typeof felt252DictEntryInitParser>;

/**
 * Initializes a dictionary access to a key by asserting that
 * the previous value cell contains the current value
 * of this dictionary key.
 *
 * If it is the first entry for this key,
 * the previous value will be zero.
 *
 * @param {VirtualMachine} vm - The virtual machine instance.
 * @param {ResOperand} dictPtr - Pointer to the dictionary access to be initialized.
 * @param key - The dictionary key to access to.
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
  vm.memory.assertEq(address.add(PREV_VALUE_OFFSET), prevValue);
};
