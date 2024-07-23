import { describe, expect, test } from 'bun:test';

import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { initSquashDataParser } from './initSquashData';
import { OpType } from 'hints/hintParamsSchema';
import { Felt } from 'primitives/felt';
import { segmentArenaHandler } from 'builtins/segmentArena';
import { allocFelt252DictParser } from './allocFelt252Dict';
import { Relocatable } from 'primitives/relocatable';
import { SquashedDictManager } from 'vm/squashedDict';

const initSegmentArenaBuiltin = (vm: VirtualMachine) => {
  const info = [
    vm.memory.addSegment(segmentArenaHandler),
    new Felt(0n),
    new Felt(0n),
  ];
  const base = vm.memory.addSegment(segmentArenaHandler);
  info.map((value, offset) => vm.memory.assertEq(base.add(offset), value));
  return base.add(info.length);
};

const ALLOC_FELT252_DICT = {
  AllocFelt252Dict: {
    segment_arena_ptr: {
      Deref: {
        register: 'AP',
        offset: 0,
      },
    },
  },
};

const INIT_SQUASH_DATA = {
  InitSquashData: {
    dict_accesses: {
      Deref: {
        register: 'AP',
        offset: 1,
      },
    },
    ptr_diff: {
      Deref: {
        register: 'AP',
        offset: 2,
      },
    },
    n_accesses: {
      Deref: {
        register: 'AP',
        offset: 3,
      },
    },
    big_keys: {
      register: 'AP',
      offset: 4,
    },
    first_key: {
      register: 'AP',
      offset: 5,
    },
  },
};

describe('InitSquashData', () => {
  test('should properly parse InitSquashData hint', () => {
    const hint = initSquashDataParser.parse(INIT_SQUASH_DATA);
    expect(hint).toEqual({
      type: HintName.InitSquashData,
      dictAccesses: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 1,
        },
      },
      ptrDiff: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 2,
        },
      },
      nAccesses: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 3,
        },
      },
      bigKeys: {
        register: Register.Ap,
        offset: 4,
      },
      firstKey: {
        register: Register.Ap,
        offset: 5,
      },
    });
  });

  test('should properly execute InitSquashData hint', () => {
    const allocHint = allocFelt252DictParser.parse(ALLOC_FELT252_DICT);
    const hint = initSquashDataParser.parse(INIT_SQUASH_DATA);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    const arenaPtr = initSegmentArenaBuiltin(vm);

    vm.memory.assertEq(vm.ap, arenaPtr);
    vm.executeHint(allocHint);

    const dictPtr = new Relocatable(4, 0);
    const key = new Felt(3n);
    const values = [
      new Felt(0n),
      new Felt(5n),
      new Felt(15n),
      new Felt(18n),
      new Felt(66n),
    ];

    const dict = vm.dictManager.get(dictPtr.segmentId);
    const dictAccessSize = 3;
    expect(dict).not.toBeUndefined();
    if (!dict) throw new Error('Undefined dict');
    dict.set(key.toString(), values[values.length - 1]);

    values.reduce((prev, curr, i) => {
      const index = i - 1;
      const keyIndex = new Felt(BigInt(index * dictAccessSize));
      const prevIndex = new Felt(BigInt(index * dictAccessSize + 1));
      const currIndex = new Felt(BigInt(index * dictAccessSize + 2));
      const prevValue = prev !== undefined ? prev : new Felt(0n);
      vm.memory.assertEq(dictPtr.add(keyIndex), key);
      vm.memory.assertEq(dictPtr.add(prevIndex), prevValue);
      vm.memory.assertEq(dictPtr.add(currIndex), curr);
      return curr;
    });

    const nAccesses = values.length - 1;
    const ptrDiff = nAccesses * dictAccessSize;
    vm.memory.assertEq(vm.ap.add(new Felt(1n)), dictPtr);
    vm.memory.assertEq(vm.ap.add(new Felt(2n)), new Felt(BigInt(ptrDiff)));
    vm.memory.assertEq(vm.ap.add(new Felt(3n)), new Felt(BigInt(nAccesses)));

    vm.executeHint(hint);

    const expectedSquashedDict = new SquashedDictManager();
    expectedSquashedDict.keyToIndices.set(key.toString(), [
      new Felt(3n),
      new Felt(2n),
      new Felt(1n),
      new Felt(0n),
    ]);
    expectedSquashedDict.keys = [key];

    expect(vm.squashedDictManager).toEqual(expectedSquashedDict);
  });
});
