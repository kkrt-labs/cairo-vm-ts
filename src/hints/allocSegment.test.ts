import { describe, expect, test } from 'bun:test';

import { Relocatable } from 'primitives/relocatable';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { allocSegmentParser } from './allocSegment';

const ALLOC_SEGMENT = {
  AllocSegment: {
    dst: {
      register: 'AP',
      offset: 0,
    },
  },
};

describe('AllocSegment', () => {
  test('should properly parse AllocSegment hint', () => {
    const hint = allocSegmentParser.parse(ALLOC_SEGMENT);
    expect(hint).toEqual({
      type: HintName.AllocSegment,
      dst: {
        register: Register.Ap,
        offset: 0,
      },
    });
  });

  test('should properly execute AllocSegment hint', () => {
    const hint = allocSegmentParser.parse(ALLOC_SEGMENT);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    expect(vm.memory.getSegmentNumber()).toEqual(2);
    vm.executeHint(hint);
    expect(vm.memory.getSegmentNumber()).toEqual(3);
    expect(vm.memory.get(vm.ap)).toEqual(new Relocatable(2, 0));
  });
});
