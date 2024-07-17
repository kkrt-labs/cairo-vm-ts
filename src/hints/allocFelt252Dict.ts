import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { resOp, ResOp } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { isFelt, isRelocatable } from 'primitives/segmentValue';
import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';
import { Felt } from 'primitives/felt';

/** Zod object to parse AllocFelt252Dict hint */
export const allocFelt252DictParser = z
  .object({ AllocFelt252Dict: z.object({ segment_arena_ptr: resOp }) })
  .transform(({ AllocFelt252Dict: { segment_arena_ptr } }) => ({
    type: HintName.AllocFelt252Dict,
    segment_arena_ptr,
  }));

/**
 * AllocFelt252Dict hint
 *
 * Add a new dictionnary.
 */
export type AllocFelt252Dict = z.infer<typeof allocFelt252DictParser>;

/**
 * Add a new dictionnary.
 *
 * - Extract the current number of dictionnaries: `dictNumber`
 * - Extract the segment info pointer: `infoPtr`
 * - Create a new dictionnary at `infoPtr + 3 * dictNumber`
 */
export const allocFelt252Dict = (
  vm: VirtualMachine,
  segmentArenaPtr: ResOp
) => {
  const arenaPtr = vm.getPointer(...vm.extractBuffer(segmentArenaPtr));
  const dictNumber = vm.memory.get(arenaPtr.sub(2));
  if (!dictNumber || !isFelt(dictNumber)) throw new ExpectedFelt(dictNumber);

  const infoPtr = vm.memory.get(arenaPtr.sub(3));
  if (!infoPtr || !isRelocatable(infoPtr))
    throw new ExpectedRelocatable(infoPtr);

  const newDict = vm.newDict();
  vm.memory.assertEq(infoPtr.add(dictNumber.mul(new Felt(3n))), newDict);
};
