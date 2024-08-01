import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import {
  resOperand,
  ResOperand,
  cellRef,
  CellRef,
} from 'hints/hintParamsSchema';

/** Zod object to parse GetSegmentArenaIndex hint */
export const getSegmentArenaIndexParser = z
  .object({
    GetSegmentArenaIndex: z.object({
      dict_end_ptr: resOperand,
      dict_index: cellRef,
    }),
  })
  .transform(({ GetSegmentArenaIndex: { dict_end_ptr, dict_index } }) => ({
    type: HintName.GetSegmentArenaIndex,
    dictEndptr: dict_end_ptr,
    dictIndex: dict_index,
  }));

/**
 * GetSegmentArenaIndex hint
 *
 * Assert the index of the dictionary to be squashed in memory
 */
export type GetSegmentArenaIndex = z.infer<typeof getSegmentArenaIndexParser>;

/**
 * Assert the index of the dictionary to be squashed in memory.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {ResOperand} dictEndPtr - Pointer to the end of the dictionary.
 * @param {CellRef} dictIndex - Address to store the index of the dictionary.
 */
export const getSegmentArenaIndex = (
  vm: VirtualMachine,
  dictEndPtr: ResOperand,
  dictIndex: CellRef
) => {
  const address = vm.getPointer(...vm.extractBuffer(dictEndPtr));
  const dict = vm.getDict(address);
  vm.memory.assertEq(vm.cellRefToRelocatable(dictIndex), dict.id);
};
