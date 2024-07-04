import { describe, expect, test } from 'bun:test';
import { HintName, OpType, allocSegment, testLessThan } from './hintSchema';
import { VirtualMachine } from 'vm/virtualMachine';
import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { HintProcessor } from './hintProcessor';
import { Relocatable } from 'primitives/relocatable';

const ALLOC_SEGMENT = {
  AllocSegment: {
    dst: {
      register: 'AP',
      offset: 0,
    },
  },
};

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

describe('hints', () => {
  describe('AllocSegment', () => {
    test('should properly parse AllocSegment hint', () => {
      const hint = allocSegment.parse(ALLOC_SEGMENT);
      expect(hint).toEqual({
        type: HintName.AllocSegment,
        dst: {
          register: Register.Ap,
          offset: 0,
        },
      });
    });

    test('should properly execute AllocSegment hint', () => {
      const hint = allocSegment.parse(ALLOC_SEGMENT);
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      expect(vm.memory.getSegmentNumber()).toEqual(2);
      HintProcessor.execute(vm, hint);
      expect(vm.memory.getSegmentNumber()).toEqual(3);
      expect(vm.memory.get(vm.ap)).toEqual(new Relocatable(2, 0));
    });
  });

  describe('TestLessThan', () => {
    test('should properly parse TestLessThan hint', () => {
      const hint = testLessThan.parse(TEST_LESS_THAN);

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
      const hint = testLessThan.parse(TEST_LESS_THAN);
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      vm.ap = vm.ap.add(1);
      vm.memory.assertEq(vm.ap, lhs);

      HintProcessor.execute(vm, hint);
      expect(
        vm.memory.get(HintProcessor.cellRefToRelocatable(vm, hint.dst))
      ).toEqual(expected);
    });
  });
});
