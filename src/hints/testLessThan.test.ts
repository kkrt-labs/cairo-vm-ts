import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { OpType } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { testLessThanParser } from './testLessThan';

const TEST_LESS_THAN = {
  TestLessThan: {
    lhs: {
      Deref: {
        register: 'AP',
        offset: 0,
      },
    },
    rhs: {
      Immediate: '0x100000000',
    },
    dst: {
      register: 'AP',
      offset: -1,
    },
  },
};

describe('TestLessThan', () => {
  test('should properly parse TestLessThan hint', () => {
    const hint = testLessThanParser.parse(TEST_LESS_THAN);

    expect(hint).toEqual({
      type: HintName.TestLessThan,
      lhs: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 0,
        },
      },
      rhs: {
        type: OpType.Immediate,
        value: new Felt(BigInt('0x100000000')),
      },
      dst: {
        register: Register.Ap,
        offset: -1,
      },
    });
  });

  test.each([
    [new Felt(-2n), new Felt(0n)],
    [new Felt(2n), new Felt(1n)],
  ])('should properly execute TestLessThan hint', (lhs, expected) => {
    const hint = testLessThanParser.parse(TEST_LESS_THAN);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    vm.ap = vm.ap.add(1);
    vm.memory.assertEq(vm.ap, lhs);

    vm.executeHint(hint);
    expect(vm.memory.get(vm.cellRefToRelocatable(hint.dst))).toEqual(expected);
  });
});
