import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { getNextDictKeyParser } from './getNextDictKey';

const GET_NEXT_DICT_KEY = {
  GetNextDictKey: {
    next_key: {
      register: 'FP',
      offset: 0,
    },
  },
};

describe('GetNextDictKey', () => {
  test('should properly parse GetNextDictKey hint', () => {
    const hint = getNextDictKeyParser.parse(GET_NEXT_DICT_KEY);
    expect(hint).toEqual({
      type: HintName.GetNextDictKey,
      nextKey: {
        register: Register.Fp,
        offset: 0,
      },
    });
  });

  test('should properly execute GetNextDictKey hint', () => {
    const hint = getNextDictKeyParser.parse(GET_NEXT_DICT_KEY);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();

    const key = new Felt(0n);
    vm.squashedDictManager.keys = [key, new Felt(1n)];

    vm.executeHint(hint);

    expect(vm.memory.get(vm.fp)).toEqual(key);
  });
});
