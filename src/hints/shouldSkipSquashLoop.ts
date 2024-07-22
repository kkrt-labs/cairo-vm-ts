import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { cellRef, CellRef } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { Felt } from 'primitives/felt';

/** Zod object to parse ShouldSkipSquashLoop hint */
export const shouldSkipSquashLoopParser = z
  .object({ ShouldSkipSquashLoop: z.object({ should_skip_loop: cellRef }) })
  .transform(({ ShouldSkipSquashLoop: { should_skip_loop } }) => ({
    type: HintName.ShouldSkipSquashLoop,
    shouldSkipLoop: should_skip_loop,
  }));

/**
 * ShouldSkipSquashLoop hint
 *
 * Check whether the squash loop should be skipped.
 */
export type ShouldSkipSquashLoop = z.infer<typeof shouldSkipSquashLoopParser>;

/**
 * Check whether the squash loop should be skipped.
 *
 * If there is still indices to be squashed, the loop is skipped.
 */
export const shouldSkipSquashLoop = (
  vm: VirtualMachine,
  shouldSkipLoop: CellRef
) => {
  const flag = vm.squashedDictManager.lastIndices().length
    ? new Felt(1n)
    : new Felt(0n);

  vm.memory.assertEq(vm.cellRefToRelocatable(shouldSkipLoop), flag);
};
