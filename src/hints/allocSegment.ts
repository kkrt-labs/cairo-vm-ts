import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { cellRef, CellRef } from 'hints/hintBaseSchema';
import { HintName } from 'hints/hintName';

/** Zod object to parse AllocSegment hint */
export const allocSegmentZod = z
  .object({ AllocSegment: z.object({ dst: cellRef }) })
  .transform(({ AllocSegment: { dst } }) => ({
    type: HintName.AllocSegment,
    dst,
  }));

/**
 * AllocSegment hint
 *
 * Add a new segment and store its pointer to `dst`
 */
export type AllocSegment = z.infer<typeof allocSegmentZod>;

/**
 * Add a new segment and store its pointer at `dst`
 */
export const allocSegment = (vm: VirtualMachine, dst: CellRef) => {
  const segmentId = vm.memory.addSegment();
  vm.memory.assertEq(vm.cellRefToRelocatable(dst), segmentId);
};
