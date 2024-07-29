import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { cellRef, CellRef } from 'hints/hintParamsSchema';

/** Zod object to parse GetCurrentAccessDelta hint */
export const getCurrentAccessDeltaParser = z
  .object({ GetCurrentAccessDelta: z.object({ index_delta_minus1: cellRef }) })
  .transform(({ GetCurrentAccessDelta: { index_delta_minus1 } }) => ({
    type: HintName.GetCurrentAccessDelta,
    indexDeltaMinusOne: index_delta_minus1,
  }));

/**
 * GetCurrentAccessDelta hint
 *
 * Assert to memory the difference between the current index to the next one.
 *
 */
export type GetCurrentAccessDelta = z.infer<typeof getCurrentAccessDeltaParser>;

/**
 * Assert `currIndex - prevIndex - 1` to `indexDeltaMinusOne`
 */
export const getCurrentAccessDelta = (
  vm: VirtualMachine,
  indexDeltaMinusOne: CellRef
) => {
  const prevIndex = vm.squashedDictManager.popIndex();
  const currIndex = vm.squashedDictManager.lastIndex();

  vm.memory.assertEq(
    vm.cellRefToRelocatable(indexDeltaMinusOne),
    currIndex.sub(prevIndex).sub(1)
  );
};
