import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { cellRef, CellRef } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse GetNextDictKey hint */
export const getNextDictKeyParser = z
  .object({ GetNextDictKey: z.object({ next_key: cellRef }) })
  .transform(({ GetNextDictKey: { next_key } }) => ({
    type: HintName.GetNextDictKey,
    nextKey: next_key,
  }));

/**
 * GetNextDictKey hint
 */
export type GetNextDictKey = z.infer<typeof getNextDictKeyParser>;

/**
 * Pop the current key and assert the next one to `nextKey`
 */
export const getNextDictKey = (vm: VirtualMachine, nextKey: CellRef) => {
  vm.squashedDictManager.popKey();
  vm.memory.assertEq(
    vm.cellRefToRelocatable(nextKey),
    vm.squashedDictManager.lastKey()
  );
};
