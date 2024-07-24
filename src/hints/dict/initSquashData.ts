import { z } from 'zod';

import { ExpectedFelt } from 'errors/primitives';

import { Felt } from 'primitives/felt';
import { isFelt } from 'primitives/segmentValue';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { CellRef, cellRef, resOperand, ResOperand } from 'hints/hintParamsSchema';

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
 * Initialize the squashed dictionnary data.
 */
export type InitSquashData = z.infer<typeof initSquashDataParser>;

/**
 * Initialize the squashed dictionnary
 *
 * - Insert all accessed keys
 * - Assert the biggest key to `bigKeys` address
 * - Assert the smallest (first) key to `firstKey` address
 *
 */
export const initSquashData = (
  vm: VirtualMachine,
  dictAccesses: ResOperand,
  ptrDiff: ResOperand,
  nAccesses: ResOperand,
  bigKeys: CellRef,
  firstKey: CellRef
) => {
  const dictAccessSize = 3;
  const address = vm.getPointer(...vm.extractBuffer(dictAccesses));
  if (Number(vm.getResOperandValue(ptrDiff)) % dictAccessSize)
    throw new Error(
      'Accessess array size must be divisible by the dict size (3)'
    );
  const nbAccesses = Number(vm.getResOperandValue(nAccesses));
  for (let i = 0; i < nbAccesses; i++) {
    const key = vm.memory.get(address.add(i * dictAccessSize));
    if (!key || !isFelt(key)) throw new ExpectedFelt(key);
    vm.squashedDictManager.insert(key, new Felt(BigInt(i)));
  }
  vm.squashedDictManager.keyToIndices.forEach((values, key) => {
    values.reverse();
    vm.squashedDictManager.keys.push(new Felt(BigInt(key)));
  });
  vm.squashedDictManager.keys.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
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
