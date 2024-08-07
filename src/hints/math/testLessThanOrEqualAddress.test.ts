import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';

import { OpType } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { testLessThanOrEqualAddressParser } from './testLessThanOrEqualAddress';
import { Relocatable } from 'primitives/relocatable';

const TEST_LESS_THAN_OR_EQUAL_ADDRESS = {
  TestLessThanOrEqualAddress: {
    lhs: {
      Deref: {
        register: 'AP',
        offset: 0,
      },
    },
    rhs: {
      Deref: {
        register: 'FP',
        offset: 1,
      },
    },
    dst: {
      register: 'AP',
      offset: -1,
    },
  },
};

describe('TestLessThanOrEqualAddress', () => {
  test('should properly parse TestLessThanOrEqualAddress hint', () => {
    const hint = testLessThanOrEqualAddressParser.parse(TEST_LESS_THAN_OR_EQUAL_ADDRESS);

    expect(hint).toEqual({
      type: HintName.TestLessThanOrEqualAddress,
      lhs: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 0,
        },
      },
      rhs: {
        type: OpType.Deref,
        cell: {
          register: Register.Fp,
          offset: 1,
        },
      },
      dst: {
        register: Register.Ap,
        offset: -1,
      },
    });
  });

  test.each([
    [new Relocatable(1, 0), new Relocatable(1, 1), new Felt(1n)],
    [new Relocatable(1, 1), new Relocatable(1, 0), new Felt(0n)],
    [new Relocatable(1, 1), new Relocatable(1, 1), new Felt(1n)],
    [new Relocatable(0, 0), new Relocatable(1, 0), new Felt(1n)],
  ])('should properly execute TestLessThanOrEqualAddress hint', (lhs, rhs, expected) => {
    const hint = testLessThanOrEqualAddressParser.parse(TEST_LESS_THAN_OR_EQUAL_ADDRESS);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();
    vm.ap = vm.ap.add(1);
    vm.memory.assertEq(vm.ap.sub(1), lhs);
    vm.fp = vm.fp.add(2);
    vm.memory.assertEq(vm.fp.sub(1), rhs);

    vm.executeHint(hint);
    expect(vm.memory.get(vm.cellRefToRelocatable(hint.dst))).toEqual(expected);
  });
});
