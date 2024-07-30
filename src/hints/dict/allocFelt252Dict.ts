import { z } from 'zod';

import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';

import { isFelt, isRelocatable } from 'primitives/segmentValue';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { resOperand, ResOperand } from 'hints/hintParamsSchema';
import { DICT_ACCESS_SIZE } from 'hints/dictionary';
import { DICT_NUMBER_OFFSET, INFO_PTR_OFFSET } from 'builtins/segmentArena';

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
 * Allocates a new dictionary using the segment arena builtin.
 */
export type AllocFelt252Dict = z.infer<typeof allocFelt252DictParser>;

/**
 * Allocates a new dictionary using the segment arena builtin.
 *
 * The segment arena builtin works by block of 3 cells:
 * - The first cell contains the base address of the info segment.
 * - The second cell contains the current number of allocated dictionaries.
 * - The third cell contains the current number of squashed dictionaries.
 *
 * @param {VirtualMachine} vm - The virtual machine instance.
 * @param {ResOperand} segmentArenaPtr -  Pointer to the first cell of the next segment arena block.
 * @throws {ExpectedFelt} If the number of dictionaries is not a valid Felt.
 * @throws {ExpectedRelocatable} If the info pointer read is not a valid Relocatable.

 */
export const allocFelt252Dict = (
  vm: VirtualMachine,
  segmentArenaPtr: ResOperand
) => {
  const arenaPtr = vm.getPointer(...vm.extractBuffer(segmentArenaPtr));
  const dictNumber = vm.memory.get(arenaPtr.sub(DICT_NUMBER_OFFSET));
  if (!dictNumber || !isFelt(dictNumber)) throw new ExpectedFelt(dictNumber);

  const infoPtr = vm.memory.get(arenaPtr.sub(INFO_PTR_OFFSET));
  if (!infoPtr || !isRelocatable(infoPtr))
    throw new ExpectedRelocatable(infoPtr);

  const newDict = vm.newDict();
  vm.memory.assertEq(infoPtr.add(dictNumber.mul(DICT_ACCESS_SIZE)), newDict);
};
