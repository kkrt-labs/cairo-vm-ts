import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';

import { OpType } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { testLessThanOrEqualParser } from './testLessThanOrEqual';

const TEST_LESS_THAN_OR_EQUAL = {
  TestLessThanOrEqual: {
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

describe('TestLessThanOrEqual', () => {
  test('should properly parse TestLessThanOrEqual hint', () => {
    const hint = testLessThanOrEqualParser.parse(TEST_LESS_THAN_OR_EQUAL);

    expect(hint).toEqual({
      type: HintName.TestLessThanOrEqual,
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
    [new Felt(2n), new Felt(1n)],
    [new Felt(BigInt('0x0ffffffff')), new Felt(1n)],
    [new Felt(BigInt('0x100000000')), new Felt(1n)],
    [new Felt(-2n), new Felt(0n)],
  ])('should properly execute TestLessThanOrEqual hint', (lhs, expected) => {
    const hint = testLessThanOrEqualParser.parse(TEST_LESS_THAN_OR_EQUAL);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    vm.ap = vm.ap.add(1);
    vm.memory.assertEq(vm.ap, lhs);

    vm.executeHint(hint);
    expect(vm.memory.get(vm.cellRefToRelocatable(hint.dst))).toEqual(expected);
  });
});
