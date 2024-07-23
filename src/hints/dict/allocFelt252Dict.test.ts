import { describe, expect, test } from 'bun:test';

import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { allocFelt252DictParser } from './allocFelt252Dict';
import { OpType } from '../hintParamsSchema';
import { Felt } from 'primitives/felt';
import { segmentArenaHandler } from 'builtins/segmentArena';
import { Relocatable } from 'primitives/relocatable';

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

describe('AllocFelt252Dict', () => {
  test('should properly parse AllocFelt252Dict hint', () => {
    const hint = allocFelt252DictParser.parse(ALLOC_FELT252_DICT);
    expect(hint).toEqual({
      type: HintName.AllocFelt252Dict,
      segmentArenaPtr: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 0,
        },
      },
    });
  });

  test('should properly execute AllocFelt252Dict hint', () => {
    const hint = allocFelt252DictParser.parse(ALLOC_FELT252_DICT);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    const arenaPtr = initSegmentArenaBuiltin(vm);

    expect(vm.memory.get(arenaPtr.sub(1))).toEqual(new Felt(0n));
    expect(vm.memory.get(arenaPtr.sub(2))).toEqual(new Felt(0n));
    expect(vm.memory.get(arenaPtr.sub(3))).toEqual(new Relocatable(2, 0));
    expect(vm.dictManager.size).toEqual(0);

    vm.memory.assertEq(vm.ap, arenaPtr);
    vm.executeHint(hint);

    const newDictPtr = new Relocatable(4, 0);
    expect(vm.memory.get(new Relocatable(2, 0))).toEqual(newDictPtr);
    expect(vm.dictManager.size).toEqual(1);
    expect(vm.dictManager.has(newDictPtr.segmentId)).toBeTrue();
  });
});
