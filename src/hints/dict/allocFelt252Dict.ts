import { z } from 'zod';

import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';

import { Felt } from 'primitives/felt';
import { isFelt, isRelocatable } from 'primitives/segmentValue';
import { DICT_ACCESS_SIZE, VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { resOperand, ResOperand } from 'hints/hintParamsSchema';

/** Zod object to parse AllocFelt252Dict hint */
export const allocFelt252DictParser = z
  .object({ AllocFelt252Dict: z.object({ segment_arena_ptr: resOperand }) })
  .transform(({ AllocFelt252Dict: { segment_arena_ptr } }) => ({
    type: HintName.AllocFelt252Dict,
    segmentArenaPtr: segment_arena_ptr,
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
  segmentArenaPtr: ResOperand
) => {
  const arenaPtr = vm.getPointer(...vm.extractBuffer(segmentArenaPtr));
  const dictNumber = vm.memory.get(arenaPtr.sub(2));
  if (!dictNumber || !isFelt(dictNumber)) throw new ExpectedFelt(dictNumber);

  const infoPtr = vm.memory.get(arenaPtr.sub(3));
  if (!infoPtr || !isRelocatable(infoPtr))
    throw new ExpectedRelocatable(infoPtr);

  const newDict = vm.newDict();
  vm.memory.assertEq(infoPtr.add(dictNumber.mul(DICT_ACCESS_SIZE)), newDict);
};
