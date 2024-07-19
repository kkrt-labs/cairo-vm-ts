import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { Deref, OpType, resOp, ResOp } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { isFelt } from 'primitives/segmentValue';
import { ExpectedFelt } from 'errors/primitives';

/** Zod object to parse Felt252DictEntryUpdate hint */
export const felt252DictEntryUpdateParser = z
  .object({
    Felt252DictEntryUpdate: z.object({
      dict_ptr: resOp,
      value: resOp,
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
 * Set a value in a dict: `dict[key] = value`
 */
export type Felt252DictEntryUpdate = z.infer<
  typeof felt252DictEntryUpdateParser
>;

/**
 * Get the dictionnary `dict` at `dictPtr`
 *
 * Get the key at address `dict - 3`
 *
 * `dict[key] = value`
 *
 */
export const felt252DictEntryUpdate = (
  vm: VirtualMachine,
  dictPtr: ResOp,
  value: ResOp
) => {
  const address = vm.getPointer(...vm.extractBuffer(dictPtr));
  const key = vm.memory.get(address.sub(3));
  if (!key || !isFelt(key)) throw new ExpectedFelt(key);
  const val =
    value.type === OpType.Deref
      ? vm.getSegmentValue((value as Deref).cell)
      : vm.getResOperandValue(value);
  vm.getDict(address).set(key, val);
};
