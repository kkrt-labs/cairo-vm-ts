import { z } from 'zod';

import { ExpectedFelt } from 'errors/primitives';

import { isFelt } from 'primitives/segmentValue';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { Deref, OpType, resOperand, ResOperand } from 'hints/hintParamsSchema';
import { KEY_OFFSET } from 'hints/dictionary';

/** Zod object to parse Felt252DictEntryUpdate hint */
export const felt252DictEntryUpdateParser = z
  .object({
    Felt252DictEntryUpdate: z.object({
      dict_ptr: resOperand,
      value: resOperand,
    }),
  })
  .transform(({ Felt252DictEntryUpdate: { dict_ptr, value } }) => ({
    type: HintName.Felt252DictEntryUpdate,
    dictPtr: dict_ptr,
    value,
  }));

/**
 * Felt252DictEntryUpdate hint
 *
 * Update an existing dict entry `key` to `value`: `dict[key] = value`
 */
export type Felt252DictEntryUpdate = z.infer<
  typeof felt252DictEntryUpdateParser
>;

/**
 * Get the dictionary `dict` at `dictPtr`
 *
 * Get the key at address `dict - 3`
 *
 * `dict[key] = value`
 *
 */
export const felt252DictEntryUpdate = (
  vm: VirtualMachine,
  dictPtr: ResOperand,
  value: ResOperand
) => {
  const address = vm.getPointer(...vm.extractBuffer(dictPtr));
  const key = vm.memory.get(address.sub(KEY_OFFSET));
  if (!key || !isFelt(key)) throw new ExpectedFelt(key);
  const val =
    value.type === OpType.Deref
      ? vm.getSegmentValue((value as Deref).cell)
      : vm.getResOperandValue(value);
  vm.getDict(address).set(key.toString(), val);
};
