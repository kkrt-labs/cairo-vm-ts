import { describe, expect, test } from 'bun:test';
import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { OpType } from 'hints/hintParamsSchema';
import { divModParser } from './divMod';
import { divMod } from './divMod';
import { Register } from 'vm/instruction';

const DIV_MOD_HINT = {
  DivMod: {
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
    quotient: {
      register: 'AP',
      offset: 2,
    },
    remainder: {
      register: 'AP',
      offset: 3,
    },
  },
};

describe('DivMod', () => {
  test('should properly parse DivMod hint', () => {
    const hint = divModParser.parse(DIV_MOD_HINT);
    expect(hint).toEqual({
      type: HintName.DivMod,
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
      quotient: {
        register: Register.Ap,
        offset: 2,
      },
      remainder: {
        register: Register.Ap,
        offset: 3,
      },
    });
  });

  test.each([
    [new Felt(17n), new Felt(5n), new Felt(3n), new Felt(2n)],
    [new Felt(10n), new Felt(3n), new Felt(3n), new Felt(1n)],
    [new Felt(20n), new Felt(4n), new Felt(5n), new Felt(0n)],
    [new Felt(15n), new Felt(6n), new Felt(2n), new Felt(3n)],
  ])(
    'should properly execute DivMod hint',
    (lhsValue, rhsValue, quotientExpected, remainderExpected) => {
      const hint = divModParser.parse(DIV_MOD_HINT);
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();

      vm.memory.assertEq(vm.ap, lhsValue);
      vm.memory.assertEq(vm.ap.add(1), rhsValue);

      divMod(vm, hint.lhs, hint.rhs, hint.quotient, hint.remainder);

      expect(vm.memory.get(vm.cellRefToRelocatable(hint.quotient))).toEqual(
        quotientExpected
      );
      expect(vm.memory.get(vm.cellRefToRelocatable(hint.remainder))).toEqual(
        remainderExpected
      );
    }
  );
});
