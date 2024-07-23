import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { cellRef, CellRef } from 'hints/hintParamsSchema';
import { Arc } from './assertLeFindSmallArc';

/** Zod object to parse AssertLeIsFirstArcExcluded hint */
export const assertLeIsFirstArcExcludedParser = z
  .object({
    AssertLeIsFirstArcExcluded: z.object({ skip_exclude_a_flag: cellRef }),
  })
  .transform(({ AssertLeIsFirstArcExcluded: { skip_exclude_a_flag } }) => ({
    type: HintName.AssertLeIsFirstArcExcluded,
    skipExcludeFirstArc: skip_exclude_a_flag,
  }));

/**
 * AssertLeIsFirstArcExcluded hint
 */
export type AssertLeIsFirstArcExcluded = z.infer<
  typeof assertLeIsFirstArcExcludedParser
>;

/**
 * Check whether the first arc from `AssertLeFindSmallArcs` is excluded.
 *
 * Read the value in scope at `excluded_arc`
 */
export const assertLeIsFirstArcExcluded = (
  vm: VirtualMachine,
  skipExcludeFirstArc: CellRef
) => {
  const excludedArc = vm.scopeManager.get('excluded_arc');
  vm.memory.assertEq(
    vm.cellRefToRelocatable(skipExcludeFirstArc),
    (excludedArc as Arc).pos != 0 ? new Felt(1n) : new Felt(0n)
  );
};
