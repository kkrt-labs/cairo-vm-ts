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

/**
 * ShouldSkipSquashLoop hint
 *
 * Assert in memory if there are keys that haven't been squashed yet.
 */
export type ShouldSkipSquashLoop = z.infer<typeof shouldSkipSquashLoopParser>;

/**
 * Assert in memory if there are keys that haven't been squashed yet.
 *
 * This is the opposite of `ShouldContinueSquashLoop`.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param shouldSkipLoop - Address to store whether the squash loop must be skipped.
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
