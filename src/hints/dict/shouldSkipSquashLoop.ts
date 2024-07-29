import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { cellRef, CellRef } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse ShouldSkipSquashLoop hint */
export const shouldSkipSquashLoopParser = z
  .object({ ShouldSkipSquashLoop: z.object({ should_skip_loop: cellRef }) })
  .transform(({ ShouldSkipSquashLoop: { should_skip_loop } }) => ({
    type: HintName.ShouldSkipSquashLoop,
    shouldSkipLoop: should_skip_loop,
  }));

/** ShouldSkipSquashLoop hint */
export type ShouldSkipSquashLoop = z.infer<typeof shouldSkipSquashLoopParser>;

/**
 * Check whether the squash loop should be skipped.
 *
 * If there is no more indices to be squashed, the loop is skipped.
 */
export const shouldSkipSquashLoop = (
  vm: VirtualMachine,
  shouldSkipLoop: CellRef
) => {
  const flag =
    vm.squashedDictManager.lastIndices().length > 1
      ? new Felt(0n)
      : new Felt(1n);

  vm.memory.assertEq(vm.cellRefToRelocatable(shouldSkipLoop), flag);
};
