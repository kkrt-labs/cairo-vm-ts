import { describe, expect, test } from 'bun:test';

import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { OpType } from './hintParamsSchema';
import { Felt } from 'primitives/felt';
import { segmentArenaHandler } from 'builtins/segmentArena';
import { Relocatable } from 'primitives/relocatable';
import { allocFelt252DictParser } from './allocFelt252Dict';
import { felt252DictUpdateParser } from './felt252DictUpdate';

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

const FELT252_DICT_UPDATE = {
  Felt252DictUpdate: {
    dict_ptr: {
      Deref: {
        register: 'AP',
        offset: 1,
      },
    },
    value: {
      Deref: {
        register: 'AP',
        offset: 3,
      },
    },
  },
};

describe('Felt252DictUpdate', () => {
  test('should properly parse Felt252DictEntryUpdate hint', () => {
    const hint = felt252DictUpdateParser.parse(FELT252_DICT_UPDATE);
    expect(hint).toEqual({
      type: HintName.Felt252DictUpdate,
      dictPtr: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 1,
        },
      },
      value: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 3,
        },
      },
    });
  });

  test('should properly execute Felt252DictUpdate hint', () => {
    const allocHint = allocFelt252DictParser.parse(ALLOC_FELT252_DICT);
    const hint = felt252DictUpdateParser.parse(FELT252_DICT_UPDATE);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    const arenaPtr = initSegmentArenaBuiltin(vm);

    vm.memory.assertEq(vm.ap, arenaPtr);
    vm.executeHint(allocHint);

    const newDictPtr = new Relocatable(4, 0);
    const key = new Relocatable(1, 2);
    const keyValue = new Felt(5n);
    const value = new Felt(13n);
    vm.memory.assertEq(vm.ap.add(1), newDictPtr.add(3));
    vm.memory.assertEq(newDictPtr, key);
    vm.memory.assertEq(vm.ap.add(2), keyValue);
    vm.memory.assertEq(vm.ap.add(3), value);

    const dict = vm.dictManager.get(newDictPtr.segmentId);
    expect(dict).not.toBeUndefined();

    vm.executeHint(hint);

    if (dict) {
      expect(dict.get(keyValue)).toEqual(value);
    }
  });
});
