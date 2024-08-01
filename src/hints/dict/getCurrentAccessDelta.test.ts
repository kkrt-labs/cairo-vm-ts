import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { getCurrentAccessDeltaParser } from './getCurrentAccessDelta';

const GET_CURRENT_ACCESS_INDEX = {
  GetCurrentAccessDelta: {
    index_delta_minus1: {
      register: 'AP',
      offset: 0,
    },
  },
};

describe('GetCurrentAccessDelta', () => {
  test('should properly parse GetCurrentAccessDelta hint', () => {
    const hint = getCurrentAccessDeltaParser.parse(GET_CURRENT_ACCESS_INDEX);
    expect(hint).toEqual({
      type: HintName.GetCurrentAccessDelta,
      indexDeltaMinusOne: {
        register: Register.Ap,
        offset: 0,
      },
    });
  });

  test('should properly execute GetCurrentAccessDelta hint', () => {
    const hint = getCurrentAccessDeltaParser.parse(GET_CURRENT_ACCESS_INDEX);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();

    const key = new Felt(0n);
    const poppedIndex = new Felt(3n);
    const lastIndex = new Felt(35n);
    const indices = [new Felt(40n), lastIndex, poppedIndex];
    vm.squashedDictManager.keyToIndices.set(key.toString(), indices);
    vm.squashedDictManager.keys = [key];

    vm.executeHint(hint);

    expect(vm.memory.get(vm.ap)).toEqual(lastIndex.sub(poppedIndex).sub(1));
  });
});
