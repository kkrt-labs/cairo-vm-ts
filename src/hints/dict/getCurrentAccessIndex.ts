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

/**
 * GetCurrentAccessIndex hint
 * Assert that the accessed index is strictly inferior to 2 ** 128.
 *
 * A dictionary cannot have more than 2 ** 128 accesses in a single run.
 */
export type GetCurrentAccessIndex = z.infer<typeof getCurrentAccessIndexParser>;

/**
 * Assert that the accessed index is strictly inferior to 2 ** 128.
 *
 * A dictionary cannot have more than 2 ** 128 accesses in a single run.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {ResOperand} rangeCheckPtr - Pointer to the range check builtin.
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
