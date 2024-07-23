import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { segmentArenaHandler } from 'builtins/segmentArena';

import { HintName } from 'hints/hintName';
import { OpType } from 'hints/hintParamsSchema';
import { allocFelt252DictParser } from './allocFelt252Dict';
import { felt252DictEntryUpdateParser } from './felt252DictEntryUpdate';

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

const FELT252_DICT_ENTRY_UPDATE = {
  Felt252DictEntryUpdate: {
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

describe('Felt252DictEntryUpdate', () => {
  test('should properly parse Felt252DictEntryUpdate hint', () => {
    const hint = felt252DictEntryUpdateParser.parse(FELT252_DICT_ENTRY_UPDATE);
    expect(hint).toEqual({
      type: HintName.Felt252DictEntryUpdate,
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

  test.each([new Felt(13n), new Relocatable(2, 0)])(
    'should properly execute Felt252DictUpdate hint',
    (value: SegmentValue) => {
      const allocHint = allocFelt252DictParser.parse(ALLOC_FELT252_DICT);
      const hint = felt252DictEntryUpdateParser.parse(
        FELT252_DICT_ENTRY_UPDATE
      );
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      const arenaPtr = initSegmentArenaBuiltin(vm);

      vm.memory.assertEq(vm.ap, arenaPtr);
      vm.executeHint(allocHint);

      const newDictPtr = new Relocatable(4, 0);
      const keyValue = new Felt(5n);
      vm.memory.assertEq(vm.ap.add(1), newDictPtr.add(3));
      vm.memory.assertEq(newDictPtr, keyValue);
      vm.memory.assertEq(vm.ap.add(3), value);

      const dict = vm.dictManager.get(newDictPtr.segmentId);
      expect(dict).not.toBeUndefined();

      vm.executeHint(hint);

      if (dict) {
        expect(dict.get(keyValue.toString())).toEqual(value);
      }
    }
  );
});
