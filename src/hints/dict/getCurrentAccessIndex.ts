import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';

import { resOperand, ResOperand } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse GetCurrentAccessIndex hint */
export const getCurrentAccessIndexParser = z
  .object({ GetCurrentAccessIndex: z.object({ range_check_ptr: resOperand }) })
  .transform(({ GetCurrentAccessIndex: { range_check_ptr } }) => ({
    type: HintName.GetCurrentAccessIndex,
    rangeCheckPtr: range_check_ptr,
  }));

/** GetCurrentAccessIndex hint */
export type GetCurrentAccessIndex = z.infer<typeof getCurrentAccessIndexParser>;

/**
 * Assert that the biggest key of the squashed dictionary is < 2 ** 128
 */
export const getCurrentAccessIndex = (
  vm: VirtualMachine,
  rangeCheckPtr: ResOperand
) => {
  vm.memory.assertEq(
    vm.getPointer(...vm.extractBuffer(rangeCheckPtr)),
    vm.squashedDictManager.lastIndex()
  );
};
