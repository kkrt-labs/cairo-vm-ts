import { describe, expect, test } from 'bun:test';
import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { OpType } from 'hints/hintParamsSchema';
import { wideMul128Parser } from './wideMul128';
import { wideMul128 } from './wideMul128';
import { Register } from 'vm/instruction';

const WIDE_MUL_128_HINT = {
  WideMul128: {
    lhs: {
      Deref: {
        register: 'AP',
        offset: 0,
      },
    },
    rhs: {
      Deref: {
        register: 'AP',
        offset: 1,
      },
    },
    high: {
      register: 'AP',
      offset: 2,
    },
    low: {
      register: 'AP',
      offset: 3,
    },
  },
};

describe('WideMul128', () => {
  test('should properly parse WideMul128 hint', () => {
    const hint = wideMul128Parser.parse(WIDE_MUL_128_HINT);
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
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 1,
        },
      },
      high: {
        register: Register.Ap,
        offset: 2,
      },
      low: {
        register: Register.Ap,
        offset: 3,
      },
    });
  });

  test.each([
    [new Felt(2n), new Felt(3n), new Felt(0n), new Felt(6n)],
    [new Felt(1n << 64n), new Felt(1n << 64n), new Felt(1n), new Felt(0n)],
    [new Felt((1n << 63n) - 1n), new Felt(2n), new Felt(0n), new Felt((1n << 64n) - 2n)],
    [new Felt(1n << 127n), new Felt(2n), new Felt(1n), new Felt(0n)],
  ])(
    'should properly execute WideMul128 hint',
    (lhsValue, rhsValue, highExpected, lowExpected) => {
      const hint = wideMul128Parser.parse(WIDE_MUL_128_HINT);
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();

      vm.memory.assertEq(vm.ap, lhsValue);
      vm.memory.assertEq(vm.ap.add(1), rhsValue);

      wideMul128(vm, hint.lhs, hint.rhs, hint.high, hint.low);

      expect(vm.memory.get(vm.cellRefToRelocatable(hint.high))).toEqual(
        highExpected
      );
      expect(vm.memory.get(vm.cellRefToRelocatable(hint.low))).toEqual(
        lowExpected
      );
    }
  );
});
