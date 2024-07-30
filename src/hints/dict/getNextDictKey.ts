import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { cellRef, CellRef } from 'hints/hintParamsSchema';

/** Zod object to parse GetNextDictKey hint */
export const getNextDictKeyParser = z
  .object({ GetNextDictKey: z.object({ next_key: cellRef }) })
  .transform(({ GetNextDictKey: { next_key } }) => ({
    type: HintName.GetNextDictKey,
    nextKey: next_key,
  }));

/**
 * GetNextDictKey hint
 *
 * Get the next key to be squashed.
 */
export type GetNextDictKey = z.infer<typeof getNextDictKeyParser>;

/**
 * Get the next key to be squashed.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {CellRef} nextKey - Address to store the next key to be squashed.
 */
export const getNextDictKey = (vm: VirtualMachine, nextKey: CellRef) => {
  vm.squashedDictManager.popKey();
  vm.memory.assertEq(
    vm.cellRefToRelocatable(nextKey),
    vm.squashedDictManager.lastKey()
  );
};
