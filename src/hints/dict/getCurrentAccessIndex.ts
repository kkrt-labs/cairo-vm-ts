import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';

import { resOp, ResOp } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse GetCurrentAccessIndex hint */
export const getCurrentAccessIndexParser = z
  .object({ GetCurrentAccessIndex: z.object({ range_check_ptr: resOp }) })
  .transform(({ GetCurrentAccessIndex: { range_check_ptr } }) => ({
    type: HintName.GetCurrentAccessIndex,
    rangeCheckPtr: range_check_ptr,
  }));

/**
 * GetCurrentAccessIndex hint
 *
 */
export type GetCurrentAccessIndex = z.infer<typeof getCurrentAccessIndexParser>;

/**
 * Assert that the biggest key of the squashed dictionnary is < 2 ** 128
 */
export const getCurrentAccessIndex = (
  vm: VirtualMachine,
  rangeCheckPtr: ResOp
) => {
  vm.memory.assertEq(
    vm.getPointer(...vm.extractBuffer(rangeCheckPtr)),
    vm.squashedDictManager.lastIndex()
  );
};
