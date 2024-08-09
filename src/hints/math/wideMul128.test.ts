import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';

import { OpType } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { wideMul128Parser, wideMul128 } from './wideMul128';

const WIDE_MUL_128 = {
  WideMul128: {
    lhs: {
      Deref: {
        register: 'AP',
        offset: 0,
      },
    },
    rhs: {
      Immediate: '0x2',
    },
    high: {
      register: 'AP',
      offset: 1,
    },
    low: {
      register: 'AP',
      offset: 2,
    },
  },
};

describe('wideMul128', () => {
  test('should properly parse WideMul128 hint', () => {
    const hint = wideMul128Parser.parse(WIDE_MUL_128);

    expect(hint).toEqual({
      type: HintName.WideMul128,
      lhs: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 0,
        },
      },
      rhs: {
        type: OpType.Immediate,
        value: new Felt(2n),
      },
      high: {
        register: Register.Ap,
        offset: 1,
      },
      low: {
        register: Register.Ap,
        offset: 2,
      },
    });
  });

  test.each([
    [new Felt(1n), new Felt(0n), new Felt(2n)],
    [new Felt((1n << 128n) - 1n), new Felt(1n), new Felt((1n << 128n) - 2n)],
    [new Felt(0n), new Felt(0n), new Felt(0n)],
  ])(
    'should properly execute WideMul128 hint',
    (lhs, expectedHigh, expectedLow) => {
      const hint = wideMul128Parser.parse(WIDE_MUL_128);
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      vm.memory.assertEq(vm.ap, lhs);

      wideMul128(vm, hint.lhs, hint.rhs, hint.high, hint.low);

      expect(vm.memory.get(vm.cellRefToRelocatable(hint.high))).toEqual(
        expectedHigh
      );
      expect(vm.memory.get(vm.cellRefToRelocatable(hint.low))).toEqual(
        expectedLow
      );
    }
  );
});