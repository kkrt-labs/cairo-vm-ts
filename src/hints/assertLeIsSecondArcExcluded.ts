import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { cellRef, CellRef } from 'hints/hintParamsSchema';
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
 *
 * Assert if the arc (a, b) was excluded.
 */
export type AssertLeIsSecondArcExcluded = z.infer<
  typeof assertLeIsSecondArcExcludedParser
>;

/**
 * Assert if the arc (a, b) from `AssertLeFindSmallArcs` was excluded.
 *
 * Read the value in scope at `excluded_arc`
 */
export const assertLeIsSecondArcExcluded = (
  vm: VirtualMachine,
  skipExcludeSecondArc: CellRef
) => {
  const excludedArc = vm.scopeManager.get('excluded_arc');
  vm.memory.assertEq(
    vm.cellRefToRelocatable(skipExcludeSecondArc),
    (excludedArc as Arc).pos != 1 ? new Felt(1n) : new Felt(0n)
  );
};
