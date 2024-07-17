import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { resOp, ResOp, cellRef, CellRef } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse GetSegmentArenaIndex hint */
export const getSegmentArenaIndexParser = z
  .object({
    GetSegmentArenaIndex: z.object({
      dict_end_ptr: resOp,
      dict_index: cellRef,
    }),
  })
  .transform(({ GetSegmentArenaIndex: { dict_end_ptr, dict_index } }) => ({
    type: HintName.GetSegmentArenaIndex,
    dict_end_ptr,
    dict_index,
  }));

/**
 * GetSegmentArenaIndex hint
 *
 * Assert the index of the dictionnary to its segment.
 * Used when finalizing the dictionnaries.
 */
export type GetSegmentArenaIndex = z.infer<typeof getSegmentArenaIndexParser>;

/**
 * Assert that `dictIndex` address stores the identifier of the
 * dictionnary found at `dictEndPtr`.
 *
 * The identifier `id` the is dictionnary number,
 * n for the n-th dictionnary, starting at 0.
 *
 */
export const getSegmentArenaIndex = (
  vm: VirtualMachine,
  dictEndPtr: ResOp,
  dictIndex: CellRef
) => {
  const index = vm.getRelocatable(dictIndex);
  const address = vm.getPointer(...vm.extractBuffer(dictEndPtr));
  const dict = vm.getDict(address);
  vm.memory.assertEq(index, dict.id);
};
