import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';
import { Relocatable } from 'primitives/relocatable';
import { HintName } from 'hints/hintName';
import { OpType, ResOperand, CellRef } from 'hints/hintParamsSchema';
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
      leftHandSide: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 0,
        },
      },
      rightHandSide: {
        type: OpType.Deref,
        cell: {
          register: Register.Ap,
          offset: 1,
        },
      },
      quotientAddress: {
        register: Register.Ap,
        offset: 2,
      },
      remainderAddress: {
        register: Register.Ap,
        offset: 3,
      },
    });
  });

  test('should properly execute DivMod hint', () => {
    const hint = divModParser.parse(DIV_MOD_HINT);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();

    const lhsValue = new Felt(17n);
    const rhsValue = new Felt(5n);
    const quotientExpected = new Felt(3n);
    const remainderExpected = new Felt(2n);

    const lhsAddr = new Relocatable(0, 0);
    const rhsAddr = new Relocatable(0, 1);
    const quotientAddr = new Relocatable(0, 2);
    const remainderAddr = new Relocatable(0, 3);

    vm.memory.assertEq(lhsAddr, lhsValue);
    vm.memory.assertEq(rhsAddr, rhsValue);
    vm.ap = new Relocatable(0, 0);  

    divMod(vm, hint.leftHandSide, hint.rightHandSide, hint.quotientAddress, hint.remainderAddress);

    expect(vm.memory.get(quotientAddr)).toEqual(quotientExpected);
    expect(vm.memory.get(remainderAddr)).toEqual(remainderExpected);
  });
});
