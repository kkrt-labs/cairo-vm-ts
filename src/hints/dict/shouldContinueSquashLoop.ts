import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { cellRef, CellRef } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse ShouldContinueSquashLoop hint */
export const shouldContinueSquashLoopParser = z
  .object({ ShouldContinueSquashLoop: z.object({ should_continue: cellRef }) })
  .transform(({ ShouldContinueSquashLoop: { should_continue } }) => ({
    type: HintName.ShouldContinueSquashLoop,
    shouldContinue: should_continue,
  }));

/** ShouldContinueSquashLoop hint */
export type ShouldContinueSquashLoop = z.infer<
  typeof shouldContinueSquashLoopParser
>;

/**
 * Assert whether the squash loop should be continued.
 *
 * If there is still indices to be squashed, the loop continue.
 */
export const shouldContinueSquashLoop = (
  vm: VirtualMachine,
  shouldContinue: CellRef
) => {
  const flag =
    vm.squashedDictManager.lastIndices().length > 1
      ? new Felt(1n)
      : new Felt(0n);

  vm.memory.assertEq(vm.cellRefToRelocatable(shouldContinue), flag);
};
