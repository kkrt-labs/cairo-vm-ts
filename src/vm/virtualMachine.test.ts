import { test, expect, describe } from 'bun:test';
import {
  ApUpdate,
  FpUpdate,
  Instruction,
  Opcode,
  PcUpdate,
  OpLogic,
} from './instruction';
import { Operands, VirtualMachine } from './virtualMachine';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { ForbiddenOperation } from 'errors/primitives';
import {
  DiffAssertValuesError,
  ExpectedFelt,
  ExpectedRelocatable,
  InvalidDstOperand,
  InvalidOp0,
  UnconstrainedResError,
  VirtualMachineError,
  Op0NotRelocatable,
  Op0Undefined,
  Op1ImmediateOffsetError,
} from 'errors/virtualMachine';

function getInstructionWithOpcodeAndOpLogic(
  opcode: Opcode,
  opLogic: OpLogic
): Instruction {
  const instruction = Instruction.default();
  instruction.opcode = opcode;
  instruction.opLogic = opLogic;
  return instruction;
}

describe('VirtualMachine', () => {
  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L16
  describe('deduceOp0', () => {
    test('should return undefined for return opcode', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'return',
        'op0 + op1'
      );
      const vm = new VirtualMachine();

      const op0 = vm.deduceOp0(instruction, undefined, undefined);
      expect(op0).toBeUndefined();
    });

    test('should deduce op0 for assert eq res logic mul', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(3n);

      const op0 = vm.deduceOp0(instruction, dst, op1);
      expect(op0).toEqual(new Felt(2n));
    });

    test('should return undefined for assert eq res logic mul with op1 = 0', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(0n);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toBeUndefined();
    });

    test('should return undefined for assert eq res logic mul with relocatables', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 2);
      const op1 = new Relocatable(1, 3);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toBeUndefined();
    });

    test('should return undefined for assert eq res logic mul with undefined', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();

      const value = vm.deduceOp0(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op0 and res for assert eq res logic add with felts', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 + op1'
      );
      const vm = new VirtualMachine();
      const dst = new Felt(7n);
      const op1 = new Felt(5n);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toEqual(new Felt(2n));
    });

    test('should deduce op0 and res for assert eq res logic add with relocatables', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 + op1'
      );
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 6);
      const op1 = new Relocatable(1, 2);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toEqual(new Felt(4n));
    });

    test('should return undefined for assert eq res logic add with undefined dst and op1', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 + op1'
      );
      const vm = new VirtualMachine();

      const value = vm.deduceOp0(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op0 for call', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'call',
        'unconstrained'
      );
      const vm = new VirtualMachine();

      const value = vm.deduceOp0(instruction, undefined, undefined);
      expect(value).toEqual(new Relocatable(0, 1));
    });
  });

  describe('deduceOp1', () => {
    test('should return undefined for return opcode', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'return',
        'op0 + op1'
      );
      const vm = new VirtualMachine();

      const op1 = vm.deduceOp1(instruction, undefined, undefined);
      expect(op1).toBeUndefined();
    });

    test('should deduce op1 for assert eq res logic add', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const dst = new Felt(3n);
      const op0 = new Felt(2n);

      const op1 = vm.deduceOp1(instruction, dst, op0);
      expect(op1).toEqual(new Felt(1n));
    });

    test('should return undefined for assert eq res logic add with op0 and dst undefined', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();

      const value = vm.deduceOp1(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op1 for assert eq res logic mul with felts', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const dst = new Felt(4n);
      const op0 = new Felt(2n);

      const op1 = vm.deduceOp1(instruction, dst, op0);
      expect(op1).toEqual(new Felt(2n));
    });

    test('should return undefined for assert eq res logic mul with op0 = 0', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const dst = new Felt(4n);
      const op0 = new Felt(0n);

      const value = vm.deduceOp1(instruction, dst, op0);
      expect(value).toBeUndefined();
    });

    test('should deduce op1 and res for assert eq res logic op1 with dst undefined', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op1'
      );
      const vm = new VirtualMachine();

      const value = vm.deduceOp1(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op1 and res for assert eq res logic op1 with dst', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op1'
      );
      const vm = new VirtualMachine();
      const dst = new Felt(7n);

      const value = vm.deduceOp1(instruction, dst, undefined);
      expect(value).toEqual(dst);
    });
  });

  describe('computeRes', () => {
    test('should deduce res with res logic op1', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op1'
      );
      const vm = new VirtualMachine();
      const op0 = new Felt(2n);
      const op1 = new Felt(2n);

      const res = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(op1);
    });
    test('should deduce res with res logic add with op0 and op1 felts', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 + op1'
      );
      const vm = new VirtualMachine();
      const op0 = new Felt(5n);
      const op1 = new Felt(2n);

      const res = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(new Felt(7n));
    });
    test('should throw an error with res logic add with op0 and op1 relocatables', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 + op1'
      );
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      expect(() => vm.computeRes(instruction, op0, op1)).toThrow(
        new ForbiddenOperation()
      );
    });
    test('should deduce res with res logic mul with op0 and op1 felts', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const op0 = new Felt(5n);
      const op1 = new Felt(2n);

      const res = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(new Felt(10n));
    });
    test('should throw an error with res logic mul with op0 and op1 relocatables', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'op0 * op1'
      );
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      expect(() => vm.computeRes(instruction, op0, op1)).toThrow(
        new VirtualMachineError(ExpectedFelt)
      );
    });
    test('should return undefined with res logic unconstrained', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'unconstrained'
      );
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      const value = vm.computeRes(instruction, op0, op1);
      expect(value).toBeUndefined();
    });
  });

  describe('deduceDst', () => {
    test('should deduce dst for assert eq with res', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'unconstrained'
      );
      const vm = new VirtualMachine();
      const res = new Felt(5n);

      const dst = vm.deduceDst(instruction, res);
      expect(dst).toEqual(res);
    });
    test('should deduce dst for call', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'call',
        'unconstrained'
      );
      const vm = new VirtualMachine();
      const res = new Felt(5n);

      const dst = vm.deduceDst(instruction, res);
      expect(dst).toEqual(new Relocatable(1, 0));
    });
    test('should return undefined for assert eq with res undefined', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'unconstrained'
      );
      const vm = new VirtualMachine();

      const dst = vm.deduceDst(instruction, undefined);
      expect(dst).toBeUndefined();
    });
    test('should return undefined dst for ret', () => {
      const instruction = getInstructionWithOpcodeAndOpLogic(
        'assert_eq',
        'unconstrained'
      );
      const vm = new VirtualMachine();

      const dst = vm.deduceDst(instruction, undefined);
      expect(dst).toBeUndefined();
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L572
  describe('opcodeAssertions', () => {
    test('should throw UnconstrainedResError on assert eq opcode and undefined res operand', () => {
      const instruction: Instruction = new Instruction(
        1,
        2,
        3,
        'fp',
        'ap',
        'ap',
        'op0 + op1',
        'pc = pc',
        'ap = ap',
        'fp = ap + 2',
        'assert_eq'
      );

      const operands: Operands = {
        dst: new Felt(8n),
        res: undefined,
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new VirtualMachineError(UnconstrainedResError)
      );
    });
    test('should throw DiffAssertError on assert eq opcode and res != dst felts', () => {
      const instruction: Instruction = new Instruction(
        1,
        2,
        3,
        'fp',
        'ap',

        'ap',
        'op0 + op1',
        'pc = pc',
        'ap = ap',
        'fp = ap + 2',
        'assert_eq'
      );

      const operands: Operands = {
        dst: new Felt(9n),
        res: new Felt(8n),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new VirtualMachineError(DiffAssertValuesError)
      );
    });
    test('should throw DiffAssertError on assert eq opcode and res != dst relocatables', () => {
      const instruction: Instruction = new Instruction(
        1,
        2,
        3,
        'fp',
        'ap',

        'ap',
        'op0 + op1',
        'pc = pc',
        'ap = ap',
        'fp = ap + 2',
        'assert_eq'
      );

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new VirtualMachineError(DiffAssertValuesError)
      );
    });
    test('should throw InvalidOp0 on call opcode and pc != op0', () => {
      const instruction: Instruction = new Instruction(
        1,
        2,
        3,
        'fp',
        'ap',

        'ap',
        'op0 + op1',
        'pc = pc',
        'ap = ap',
        'fp = ap + 2',
        'call'
      );

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new VirtualMachineError(InvalidOp0)
      );
    });
    test('should throw InvalidDstError on call opcode and fp != dst', () => {
      const instruction: Instruction = new Instruction(
        1,
        2,
        3,
        'fp',
        'ap',

        'ap',
        'op0 + op1',
        'pc = pc',
        'ap = ap',
        'fp = ap + 2',
        'call'
      );

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Relocatable(0, 1),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new VirtualMachineError(InvalidDstOperand)
      );
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L284
  describe('updatePc', () => {
    test('regular', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });
    test('regular with imm', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'pc',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.pc).toEqual(new Relocatable(0, 2));
    });
    test('jmp res relocatable', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = res',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 5),
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.pc).toEqual(operands.res);
    });
    test('jmp res felt', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = res',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(0n),
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new VirtualMachineError(ExpectedRelocatable)
      );
    });
    test('jmp without res', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = res',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new VirtualMachineError(UnconstrainedResError)
      );
    });
    test('jmp rel res felt', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc + res',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(5n),
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.pc).toEqual(new Relocatable(0, 5));
    });
    test('jmp rel res relocatable', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc + res',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 5),
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new VirtualMachineError(ExpectedFelt)
      );
    });
    test('jmp rel res relocatable', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc + res',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new VirtualMachineError(UnconstrainedResError)
      );
    });
    test('jnz des is zero no imm', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Felt(0n),
      };

      vm.updatePc(instruction, operands);
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });
    test('jnz des is zero imm', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'pc',
        'unconstrained',
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Felt(0n),
      };

      vm.updatePc(instruction, operands);
      expect(vm.pc).toEqual(new Relocatable(0, 2));
    });
    test('jnz des not zero op1 felt', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'pc',
        'unconstrained',
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: new Felt(3n),
        res: undefined,
        dst: new Felt(1n),
      };

      vm.updatePc(instruction, operands);
      expect(vm.pc).toEqual(new Relocatable(0, 3));
    });
    test('jnz des not zero op1 relocatable', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'pc',
        'unconstrained',
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: new Relocatable(0, 0),
        res: undefined,
        dst: new Felt(1n),
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new VirtualMachineError(ExpectedFelt)
      );
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L160
  describe('updateFp', () => {
    test('regular', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateFp(instruction, operands);
      expect(vm.fp).toEqual(new Relocatable(1, 0));
    });
    test('dst felt', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = relocatable(dst) || fp += felt(dst)',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Felt(9n),
      };

      vm.updateFp(instruction, operands);
      expect(vm.fp).toEqual(new Relocatable(1, 9));
    });
    test('dst relocatable', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = relocatable(dst) || fp += felt(dst)',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Relocatable(1, 9),
      };

      vm.updateFp(instruction, operands);
      expect(vm.fp).toEqual(new Relocatable(1, 9));
    });
    test('ap plus 2', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = ap + 2',
        'no-op'
      );

      const vm = new VirtualMachine();
      vm.ap = new Relocatable(1, 7);
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateFp(instruction, operands);
      expect(vm.fp).toEqual(new Relocatable(1, 9));
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L213
  describe('updateAp', () => {
    test('regular', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.ap).toEqual(new Relocatable(1, 0));
    });
    test('add 2', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap += 2',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.ap).toEqual(new Relocatable(1, 2));
    });
    test('add 1', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap++',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.ap).toEqual(new Relocatable(1, 1));
    });
    test('add res felt', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap + res',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(5n),
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.ap).toEqual(new Relocatable(1, 5));
    });
    test('add res relocatable', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap + res',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 0),
        dst: undefined,
      };

      expect(() => vm.updateAp(instruction, operands)).toThrow(
        new VirtualMachineError(ExpectedFelt)
      );
    });
    test('add no res', () => {
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap + res',
        'fp = fp',
        'no-op'
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      expect(() => vm.updateAp(instruction, operands)).toThrow(
        new VirtualMachineError(UnconstrainedResError)
      );
    });
  });

  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L122
  describe('updateRegisters', () => {
    test('should keep ap/fp the same', () => {
      const vm = new VirtualMachine();
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc',
        'ap = ap',
        'fp = fp',
        'no-op'
      );
      const operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateRegisters(instruction, operands);
      expect(vm.ap).toEqual(new Relocatable(1, 0));
      expect(vm.fp).toEqual(new Relocatable(1, 0));
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });
    test('should update the register with mixed types', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);
      const instruction = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',

        'ap',
        'unconstrained',
        'pc = pc + res',
        'ap += 2',
        'fp = relocatable(dst) || fp += felt(dst)',
        'no-op'
      );
      const operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(8n),
        dst: new Relocatable(1, 11),
      };

      vm.updateRegisters(instruction, operands);
      const registers = {
        pc: new Relocatable(0, 12),
        ap: new Relocatable(1, 7),
        fp: new Relocatable(1, 11),
      };
      expect({ ap: vm.ap, fp: vm.fp, pc: vm.pc }).toEqual(registers);
    });
  });

  describe('incrementPc', () => {
    test('should successfully increment pc', () => {
      const vm = new VirtualMachine();
      vm.incrementPc(2);
      expect(vm.pc).toEqual(new Relocatable(0, 2));
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm/blob/main/vm/src/vm/context/run_context.rs#L229
  describe('computeOp1Address', () => {
    test('should compute op1 addr for fp register', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      const op1Addr = vm.computeOp1Address('fp', 1, undefined);

      expect(op1Addr.segment).toEqual(1);
      expect(op1Addr.offset).toEqual(7);
    });

    test('should compute op1 addr for ap register', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      const op1Addr = vm.computeOp1Address('ap', 1, undefined);

      expect(op1Addr.segment).toEqual(1);
      expect(op1Addr.offset).toEqual(6);
    });

    test('should compute op1 addr for op1 src imm', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      const op1Addr = vm.computeOp1Address('pc', 1, undefined);

      expect(op1Addr.segment).toEqual(0);
      expect(op1Addr.offset).toEqual(5);
    });

    test('should throw an error Op1ImmediateOffsetError for op1 src imm with incorrect offset', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      expect(() => vm.computeOp1Address('pc', 2, undefined)).toThrow(
        new VirtualMachineError(Op1ImmediateOffsetError)
      );
    });

    test('should compute op1 addr for op1 src op0 with op0 relocatable', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      const op1Addr = vm.computeOp1Address('op0', 1, new Relocatable(1, 7));

      expect(op1Addr.segment).toEqual(1);
      expect(op1Addr.offset).toEqual(8);
    });

    test('should throw an error Op0NotRelocatable for op1 src op0 with op0 felt', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      expect(() => vm.computeOp1Address('op0', 1, new Felt(7n))).toThrow(
        new VirtualMachineError(Op0NotRelocatable)
      );
    });

    test('should throw an error Op0Undefined for op1 src op0 with op0 undefined', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      expect(() => vm.computeOp1Address('op0', 1, undefined)).toThrow(
        new VirtualMachineError(Op0Undefined)
      );
    });
  });
});
