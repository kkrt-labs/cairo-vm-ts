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

/**
 * ShouldContinueSquashLoop hint
 *
 * Assert in memory if there are keys that haven't been squashed yet.
 */
export type ShouldContinueSquashLoop = z.infer<
  typeof shouldContinueSquashLoopParser
>;

/**
 * Assert in memory if there are keys that haven't been squashed yet.
 *
 * This is the opposite of `ShouldSkipSquashLoop`.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {CellRef} shouldContinue - Address to store whether the squash loop must continue.
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
