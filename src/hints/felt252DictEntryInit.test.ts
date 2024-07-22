import { describe, expect, test } from 'bun:test';

import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { OpType } from './hintParamsSchema';
import { Felt } from 'primitives/felt';
import { segmentArenaHandler } from 'builtins/segmentArena';
import { Relocatable } from 'primitives/relocatable';
import { allocFelt252DictParser } from './allocFelt252Dict';
import { felt252DictEntryInitParser } from './felt252DictEntryInit';

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

const FELT252_DICT_ENTRY_INIT = {
  Felt252DictEntryInit: {
    dict_ptr: {
      Deref: {
        register: 'AP',
        offset: 1,
      },
    },
    key: {
      Deref: {
        register: 'AP',
        offset: 2,
      },
    },
  },
};

describe('Felt252DictEntryInit', () => {
  test('should properly parse Felt252DictEntryInit hint', () => {
    const hint = felt252DictEntryInitParser.parse(FELT252_DICT_ENTRY_INIT);
    expect(hint).toEqual({
      type: HintName.Felt252DictEntryInit,
      dictPtr: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 1,
        },
      },
      key: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 2,
        },
      },
    });
  });

  test('should properly execute Felt252DictEntryInit hint', () => {
    const allocHint = allocFelt252DictParser.parse(ALLOC_FELT252_DICT);
    const hint = felt252DictEntryInitParser.parse(FELT252_DICT_ENTRY_INIT);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    const arenaPtr = initSegmentArenaBuiltin(vm);

    vm.memory.assertEq(vm.ap, arenaPtr);
    vm.executeHint(allocHint);

    const newDictPtr = new Relocatable(4, 0);
    const key = new Felt(5n);
    vm.memory.assertEq(vm.ap.add(1), newDictPtr);
    vm.memory.assertEq(vm.ap.add(2), key);

    const dict = vm.dictManager.get(newDictPtr.segmentId);
    expect(dict).not.toBeUndefined();

    const keyValue = new Felt(13n);
    dict?.set(key, keyValue);

    vm.executeHint(hint);

    if (dict) {
      expect(dict.get(key)).toEqual(new Felt(13n));
      expect(vm.memory.get(newDictPtr.add(1))).toEqual(keyValue);
    }
  });
});
