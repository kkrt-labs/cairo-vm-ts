import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { CellRef, cellRef, resOp, ResOp } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { isFelt } from 'primitives/segmentValue';
import { ExpectedFelt } from 'errors/primitives';
import { Felt } from 'primitives/felt';

/** Zod object to parse InitSquashData hint */
export const initSquashDataParser = z
  .object({
    InitSquashData: z.object({
      dict_accesses: resOp,
      ptr_diff: resOp,
      n_accesses: resOp,
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
 * Set a value in a dict: `dict[key] = value`
 */
export type InitSquashData = z.infer<typeof initSquashDataParser>;

/**
 * Get the dictionnary `dict` at `dictPtr`
 *
 * Get the key at address `dict - 3`
 *
 * `dict[key] = value`
 *
 */
export const initSquashData = (
  vm: VirtualMachine,
  dictAccesses: ResOp,
  ptrDiff: ResOp,
  nAccesses: ResOp,
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
  vm.squashedDictManager.keyToIndices.forEach((value, key) => {
    value.reverse();
    vm.squashedDictManager.keys.push(key);
  });
  vm.squashedDictManager.keys.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const bigKeysAddress = vm.getRelocatable(bigKeys);
  vm.memory.assertEq(
    bigKeysAddress,
    vm.squashedDictManager.keys[0] > new Felt(1n << 128n)
      ? new Felt(1n)
      : new Felt(0n)
  );
  const firstKeyAddress = vm.getRelocatable(firstKey);
  vm.memory.assertEq(
    firstKeyAddress,
    vm.squashedDictManager.keys[vm.squashedDictManager.keys.length - 1]
  );
};
