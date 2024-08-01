import { z } from 'zod';

import { ExpectedFelt } from 'errors/primitives';
import { InvalidDictAccessesNumber } from 'errors/hints';

import { Felt } from 'primitives/felt';
import { isFelt } from 'primitives/segmentValue';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import {
  CellRef,
  cellRef,
  resOperand,
  ResOperand,
} from 'hints/hintParamsSchema';
import { DICT_ACCESS_SIZE } from 'hints/dictionary';

/** Zod object to parse InitSquashData hint */
export const initSquashDataParser = z
  .object({
    InitSquashData: z.object({
      dict_accesses: resOperand,
      ptr_diff: resOperand,
      n_accesses: resOperand,
      big_keys: cellRef,
      first_key: cellRef,
    }),
  })
  .transform(
    ({
      InitSquashData: {
        dict_accesses,
        ptr_diff,
        n_accesses,
        big_keys,
        first_key,
      },
    }) => ({
      type: HintName.InitSquashData,
      dictAccesses: dict_accesses,
      ptrDiff: ptr_diff,
      nAccesses: n_accesses,
      bigKeys: big_keys,
      firstKey: first_key,
    })
  );

/**
 * InitSquashData hint
 *
 * Initialize the squashing of a dictionary.
 */
export type InitSquashData = z.infer<typeof initSquashDataParser>;

/**
 * Initialize the squashing of a dictionary.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {ResOperand} dictAccesses - Pointer to the start of the dictionary to be squashed.
 * @param {ResOperand} ptrDiff - The difference between dictionary end and start pointers.
 * @param {ResOperand} nAccesses - Number of dictonary accesses.
 * @param {CellRef} bigKeys - Address to store if the biggest key of the dictionary is above 2 ** 128 or not.
 * @param {CellRef} firstKey - Address to store the first key to be squashed.
 */
export const initSquashData = (
  vm: VirtualMachine,
  dictAccesses: ResOperand,
  ptrDiff: ResOperand,
  nAccesses: ResOperand,
  bigKeys: CellRef,
  firstKey: CellRef
) => {
  const address = vm.getPointer(...vm.extractBuffer(dictAccesses));

  const ptrDiffValue = Number(vm.getResOperandValue(ptrDiff));
  if (ptrDiffValue % DICT_ACCESS_SIZE)
    throw new InvalidDictAccessesNumber(ptrDiffValue, DICT_ACCESS_SIZE);

  const nbAccesses = Number(vm.getResOperandValue(nAccesses));
  for (let i = 0; i < nbAccesses; i++) {
    const key = vm.memory.get(address.add(i * DICT_ACCESS_SIZE));
    if (!key || !isFelt(key)) throw new ExpectedFelt(key);
    vm.squashedDictManager.insert(key, new Felt(BigInt(i)));
  }

  vm.squashedDictManager.keyToIndices.forEach((values, key) => {
    values.reverse();
    vm.squashedDictManager.keys.push(new Felt(BigInt(key)));
  });
  vm.squashedDictManager.keys.sort((a, b) => b.compare(a));

  vm.memory.assertEq(
    vm.cellRefToRelocatable(bigKeys),
    vm.squashedDictManager.keys[0] > new Felt(1n << 128n)
      ? new Felt(1n)
      : new Felt(0n)
  );
  vm.memory.assertEq(
    vm.cellRefToRelocatable(firstKey),
    vm.squashedDictManager.keys[vm.squashedDictManager.keys.length - 1]
  );
};
