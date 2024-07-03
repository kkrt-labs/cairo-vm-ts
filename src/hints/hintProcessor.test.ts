import { describe, expect, test } from 'bun:test';
import { HintName, OpType, testLessThan } from './hintSchema';
import { VirtualMachine } from 'vm/virtualMachine';
import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { HintProcessor } from './hintProcessor';

describe('hints', () => {
  describe('TestLessThan', () => {
    test('should properly parse TestLessThan hint', () => {
      const hintObj = {
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

      const hint = testLessThan.parse(hintObj);

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

    test('should properly execute TestLessThan hint', () => {
      const hintObj = {
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

      const hint = testLessThan.parse(hintObj);
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();
      vm.ap = vm.ap.add(1);
      vm.memory.assertEq(vm.ap, new Felt(10n));

      HintProcessor.execute(vm, hint);
      expect(
        vm.memory.get(HintProcessor.cellRefToRelocatable(vm, hint.dst))
      ).toEqual(new Felt(1n));
    });
  });
});
