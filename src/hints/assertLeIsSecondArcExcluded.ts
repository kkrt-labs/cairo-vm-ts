import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { cellRef, CellRef } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { Felt } from 'primitives/felt';
import { Arc } from './assertLeFindSmallArc';

/** Zod object to parse AssertLeIsSecondArcExcluded hint */
export const assertLeIsSecondArcExcludedParser = z
  .object({
    AssertLeIsSecondArcExcluded: z.object({ skip_exclude_b_minus_a: cellRef }),
  })
  .transform(({ AssertLeIsSecondArcExcluded: { skip_exclude_b_minus_a } }) => ({
    type: HintName.AssertLeIsSecondArcExcluded,
    skipExcludeSecondArc: skip_exclude_b_minus_a,
  }));

/**
 * AssertLeIsSecondArcExcluded hint
 */
export type AssertLeIsSecondArcExcluded = z.infer<
  typeof assertLeIsSecondArcExcludedParser
>;

/**
 * Check whether the first arc from `` is excluded.
 */
export const assertLeIsSecondArcExcluded = (
  vm: VirtualMachine,
  skipExcludeAFlag: CellRef
) => {
  const excludedArc = vm.scopeManager.get('excluded_arc');
  vm.memory.assertEq(
    vm.cellRefToRelocatable(skipExcludeAFlag),
    (excludedArc as Arc).pos != 1 ? new Felt(1n) : new Felt(0n)
  );
};
