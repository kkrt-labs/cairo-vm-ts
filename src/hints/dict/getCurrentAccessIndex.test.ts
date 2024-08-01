import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { rangeCheckHandler } from 'builtins/rangeCheck';

import { HintName } from 'hints/hintName';
import { OpType } from 'hints/hintParamsSchema';
import { getCurrentAccessIndexParser } from './getCurrentAccessIndex';

const GET_CURRENT_ACCESS_INDEX = {
  GetCurrentAccessIndex: {
    range_check_ptr: {
      Deref: {
        register: 'AP',
        offset: 0,
      },
    },
  },
};

describe('GetCurrentAccessIndex', () => {
  test('should properly parse GetCurrentAccessIndex hint', () => {
    const hint = getCurrentAccessIndexParser.parse(GET_CURRENT_ACCESS_INDEX);
    expect(hint).toEqual({
      type: HintName.GetCurrentAccessIndex,
      rangeCheckPtr: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 0,
        },
      },
    });
  });

  test('should properly execute GetCurrentAccessIndex hint', () => {
    const hint = getCurrentAccessIndexParser.parse(GET_CURRENT_ACCESS_INDEX);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    const rangeCheck = vm.memory.addSegment(rangeCheckHandler(128n));

    vm.memory.assertEq(vm.ap, rangeCheck);

    const key = new Felt(0n);
    const indices = [new Felt(35n), new Felt(6n), new Felt(3n)];
    vm.squashedDictManager.keyToIndices.set(key.toString(), indices);
    vm.squashedDictManager.keys = [key];

    vm.executeHint(hint);

    expect(vm.memory.get(rangeCheck)).toEqual(indices[indices.length - 1]);
  });
});
