import { describe, expect, test } from 'bun:test';

import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { OpType } from './hintParamsSchema';
import { Felt } from 'primitives/felt';
import { segmentArenaHandler } from 'builtins/segmentArena';
import { Relocatable } from 'primitives/relocatable';
import { getSegmentArenaIndexParser } from './getSegmentArenaIndex';
import { allocFelt252DictParser } from './allocFelt252Dict';

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

const GET_SEGMENT_ARENA_INDEX = {
  GetSegmentArenaIndex: {
    dict_end_ptr: {
      Deref: {
        register: 'AP',
        offset: 1,
      },
    },
    dict_index: {
      register: 'AP',
      offset: 2,
    },
  },
};

describe('GetSegmentArenaIndex', () => {
  test('should properly parse GetSegmentArenaIndex hint', () => {
    const hint = getSegmentArenaIndexParser.parse(GET_SEGMENT_ARENA_INDEX);
    expect(hint).toEqual({
      type: HintName.GetSegmentArenaIndex,
      dict_end_ptr: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 1,
        },
      },
      dict_index: {
        register: Register.Ap,
        offset: 2,
      },
    });
  });

  test('should properly execute GetSegmentArenaIndex hint', () => {
    const allocHint = allocFelt252DictParser.parse(ALLOC_FELT252_DICT);
    const hint = getSegmentArenaIndexParser.parse(GET_SEGMENT_ARENA_INDEX);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    const arenaPtr = initSegmentArenaBuiltin(vm);

    vm.memory.assertEq(vm.ap, arenaPtr);
    vm.executeHint(allocHint);

    const newDictPtr = new Relocatable(4, 0);
    vm.memory.assertEq(vm.ap.add(1), newDictPtr);

    vm.executeHint(hint);

    const dict = vm.dictManager.get(newDictPtr.segmentId);
    expect(dict).not.toBeUndefined();

    if (dict) {
      expect(vm.memory.get(vm.ap.add(2))).toEqual(dict.id);
    }
  });
});
