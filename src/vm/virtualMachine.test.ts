import { test, expect, describe } from 'bun:test';
import {
  ApUpdate,
  FpUpdate,
  Instruction,
  Op1Src,
  Opcode,
  PcUpdate,
  RegisterFlag,
  ResLogic,
} from './instruction';
import { Operands, VirtualMachine } from './virtualMachine';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { ForbiddenOperation } from 'result/primitives';
import {
  DiffAssertValuesError,
  ExpectedFelt,
  InvalidDstOperand,
  InvalidOperand0,
  UnconstrainedResError,
  VirtualMachineError,
} from 'result/virtualMachine';
import { Int16 } from 'primitives/int';
import { RunContext } from 'run-context/runContext';

function getInstructionWithOpcodeAndResLogic(
  opcode: Opcode,
  resLogic: ResLogic
): Instruction {
  const instruction = Instruction.default();
  instruction.opcode = opcode;
  instruction.resLogic = resLogic;
  return instruction;
}

describe('VirtualMachine', () => {
  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L16
  describe('deduceOp0', () => {
    test('should return undefined for return opcode', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.Ret,
        ResLogic.Add
      );
      const vm = new VirtualMachine();

      const { value: op0 } = vm.deduceOp0(instruction, undefined, undefined);
      expect(op0).toEqual([undefined, undefined]);
    });

    test('should deduce op0 for assert eq res logic mul', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(3n);

      const { value: op0 } = vm.deduceOp0(instruction, dst, op1);
      expect(op0).toEqual([new Felt(2n), dst]);
    });

    test('should return undefined for assert eq res logic mul with op1 = 0', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(0n);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should return undefined for assert eq res logic mul with relocatables', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 2);
      const op1 = new Relocatable(1, 3);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should return undefined for assert eq res logic mul with undefined', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp0(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should deduce op0 and res for assert eq res logic add with felts', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();
      const dst = new Felt(7n);
      const op1 = new Felt(5n);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([new Felt(2n), dst]);
    });

    test('should deduce op0 and res for assert eq res logic add with relocatables', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 6);
      const op1 = new Relocatable(1, 2);

      const { value, error } = vm.deduceOp0(instruction, dst, op1);
      expect(error).toBeUndefined();
      expect(value).toEqual([new Felt(4n), dst]);
    });

    test('should return undefined for assert eq res logic add with undefined dst and op1', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp0(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should deduce op0 for call', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.Call,
        ResLogic.Unconstrained
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp0(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([new Relocatable(0, 1), undefined]);
    });
  });

  describe('deduceOp1', () => {
    test('should return undefined for return opcode', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.Ret,
        ResLogic.Add
      );
      const vm = new VirtualMachine();

      const { value: op1, error } = vm.deduceOp1(
        instruction,
        undefined,
        undefined
      );
      expect(error).toBeUndefined();
      expect(op1).toEqual([undefined, undefined]);
    });

    test('should deduce op1 for assert eq res logic add', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Felt(3n);
      const op0 = new Felt(2n);

      const { value: op1 } = vm.deduceOp1(instruction, dst, op0);
      expect(op1).toEqual([new Felt(1n), dst]);
    });

    test('should return undefined for assert eq res logic add with op0 and dst undefined', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp1(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should deduce op1 for assert eq res logic mul with felts', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Felt(4n);
      const op0 = new Felt(2n);

      const { value: op1 } = vm.deduceOp1(instruction, dst, op0);
      expect(op1).toEqual([new Felt(2n), dst]);
    });

    test('should return undefined for assert eq res logic mul with op0 = 0', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const dst = new Felt(4n);
      const op0 = new Felt(0n);

      const { value, error } = vm.deduceOp1(instruction, dst, op0);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should deduce op1 and res for assert eq res logic op1 with dst undefined', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Op1
      );
      const vm = new VirtualMachine();

      const { value, error } = vm.deduceOp1(instruction, undefined, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([undefined, undefined]);
    });

    test('should deduce op1 and res for assert eq res logic op1 with dst', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Op1
      );
      const vm = new VirtualMachine();
      const dst = new Felt(7n);

      const { value, error } = vm.deduceOp1(instruction, dst, undefined);
      expect(error).toBeUndefined();
      expect(value).toEqual([dst, dst]);
    });
  });

  describe('computeRes', () => {
    test('should deduce res with res logic op1', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Op1
      );
      const vm = new VirtualMachine();
      const op0 = new Felt(2n);
      const op1 = new Felt(2n);

      const { value: res } = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(op1);
    });
    test('should deduce res with res logic add with op0 and op1 felts', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();
      const op0 = new Felt(5n);
      const op1 = new Felt(2n);

      const { value: res } = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(new Felt(7n));
    });
    test('should return an error with res logic add with op0 and op1 relocatables', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Add
      );
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      const { error } = vm.computeRes(instruction, op0, op1);
      expect(error).toEqual(new VirtualMachineError(ForbiddenOperation));
    });
    test('should deduce res with res logic mul with op0 and op1 felts', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const op0 = new Felt(5n);
      const op1 = new Felt(2n);

      const { value: res } = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(new Felt(10n));
    });
    test('should return an error with res logic mul with op0 and op1 relocatables', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Mul
      );
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      const { error } = vm.computeRes(instruction, op0, op1);
      expect(error).toEqual(new VirtualMachineError(ForbiddenOperation));
    });
    test('should return undefined with res logic unconstrained', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Unconstrained
      );
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      const { value, error } = vm.computeRes(instruction, op0, op1);
      expect(error).toBeUndefined();
      expect(value).toBeUndefined();
    });
  });

  describe('deduceDst', () => {
    test('should deduce dst for assert eq with res', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Unconstrained
      );
      const vm = new VirtualMachine();
      const res = new Felt(5n);

      const { value: dst } = vm.deduceDst(instruction, res);
      expect(dst).toEqual(res);
    });
    test('should deduce dst for call', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.Call,
        ResLogic.Unconstrained
      );
      const vm = new VirtualMachine();
      const res = new Felt(5n);

      const { value: dst } = vm.deduceDst(instruction, res);
      expect(dst).toEqual(new Relocatable(1, 0));
    });
    test('should return undefined for assert eq with res undefined', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Unconstrained
      );
      const vm = new VirtualMachine();

      const { value: dst } = vm.deduceDst(instruction, undefined);
      expect(dst).toBeUndefined();
    });
    test('should return undefined dst for ret', () => {
      const instruction = getInstructionWithOpcodeAndResLogic(
        Opcode.AssertEq,
        ResLogic.Unconstrained
      );
      const vm = new VirtualMachine();

      const { value: dst } = vm.deduceDst(instruction, undefined);
      expect(dst).toBeUndefined();
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L572
  describe('opcodeAssertions', () => {
    test('should return UnconstrainedResError on assert eq opcode and undefined res operand', () => {
      const instruction: Instruction = new Instruction(
        1 as Int16,
        2 as Int16,
        3 as Int16,
        RegisterFlag.FP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Add,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.ApPlus2,
        Opcode.AssertEq
      );

      const operands: Operands = {
        dst: new Felt(8n),
        res: undefined,
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      const { error } = vm.opcodeAssertion(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(UnconstrainedResError));
    });
    test('should return DiffAssertError on assert eq opcode and res != dst felts', () => {
      const instruction: Instruction = new Instruction(
        1 as Int16,
        2 as Int16,
        3 as Int16,
        RegisterFlag.FP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Add,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.ApPlus2,
        Opcode.AssertEq
      );

      const operands: Operands = {
        dst: new Felt(9n),
        res: new Felt(8n),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      const { error } = vm.opcodeAssertion(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(DiffAssertValuesError));
    });
    test('should return DiffAssertError on assert eq opcode and res != dst relocatables', () => {
      const instruction: Instruction = new Instruction(
        1 as Int16,
        2 as Int16,
        3 as Int16,
        RegisterFlag.FP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Add,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.ApPlus2,
        Opcode.AssertEq
      );

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      const { error } = vm.opcodeAssertion(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(DiffAssertValuesError));
    });
    test('should return InvalidOperand0 on call opcode and pc != op0', () => {
      const instruction: Instruction = new Instruction(
        1 as Int16,
        2 as Int16,
        3 as Int16,
        RegisterFlag.FP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Add,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.ApPlus2,
        Opcode.Call
      );

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      const { error } = vm.opcodeAssertion(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(InvalidOperand0));
    });
    test('should return InvalidDstError on call opcode and fp != dst', () => {
      const instruction: Instruction = new Instruction(
        1 as Int16,
        2 as Int16,
        3 as Int16,
        RegisterFlag.FP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Add,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.ApPlus2,
        Opcode.Call
      );

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Relocatable(0, 1),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      const { error } = vm.opcodeAssertion(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(InvalidDstOperand));
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L284
  describe('updatePc', () => {
    test('regular', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.runContext.pc).toEqual(new Relocatable(0, 1));
    });
    test('regular with imm', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.Imm,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.runContext.pc).toEqual(new Relocatable(0, 2));
    });
    test('jmp res relocatable', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Jump,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 5),
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.runContext.pc).toEqual(operands.res);
    });
    test('jmp res felt', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Jump,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(0n),
        dst: undefined,
      };

      const { error } = vm.updatePc(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(ExpectedFelt));
    });
    test('jmp without res', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Jump,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      const { error } = vm.updatePc(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(UnconstrainedResError));
    });
    test('jmp rel res felt', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.JumpRel,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(5n),
        dst: undefined,
      };

      vm.updatePc(instruction, operands);
      expect(vm.runContext.pc).toEqual(new Relocatable(0, 5));
    });
    test('jmp rel res relocatable', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.JumpRel,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 5),
        dst: undefined,
      };

      const { error } = vm.updatePc(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(ExpectedFelt));
    });
    test('jmp rel res relocatable', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.JumpRel,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      const { error } = vm.updatePc(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(UnconstrainedResError));
    });
    test('jnz des is zero no imm', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Jnz,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Felt(0n),
      };

      vm.updatePc(instruction, operands);
      expect(vm.runContext.pc).toEqual(new Relocatable(0, 1));
    });
    test('jnz des is zero imm', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.Imm,
        ResLogic.Unconstrained,
        PcUpdate.Jnz,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Felt(0n),
      };

      vm.updatePc(instruction, operands);
      expect(vm.runContext.pc).toEqual(new Relocatable(0, 2));
    });
    test('jnz des not zero op1 felt', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.Imm,
        ResLogic.Unconstrained,
        PcUpdate.Jnz,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: new Felt(3n),
        res: undefined,
        dst: new Felt(1n),
      };

      vm.updatePc(instruction, operands);
      expect(vm.runContext.pc).toEqual(new Relocatable(0, 3));
    });
    test('jnz des not zero op1 relocatable', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.Imm,
        ResLogic.Unconstrained,
        PcUpdate.Jnz,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: new Relocatable(0, 0),
        res: undefined,
        dst: new Felt(1n),
      };

      const { error } = vm.updatePc(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(ExpectedFelt));
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L160
  describe('updateFp', () => {
    test('regular', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateFp(instruction, operands);
      expect(vm.runContext.fp).toEqual(new Relocatable(1, 0));
    });
    test('dst felt', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Dst,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Felt(9n),
      };

      vm.updateFp(instruction, operands);
      expect(vm.runContext.fp).toEqual(new Relocatable(1, 9));
    });
    test('dst relocatable', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Dst,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: new Relocatable(1, 9),
      };

      vm.updateFp(instruction, operands);
      expect(vm.runContext.fp).toEqual(new Relocatable(1, 9));
    });
    test('ap plus 2', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.ApPlus2,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      vm.runContext.ap = new Relocatable(1, 7);
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateFp(instruction, operands);
      expect(vm.runContext.fp).toEqual(new Relocatable(1, 9));
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L213
  describe('updateAp', () => {
    test('regular', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.runContext.ap).toEqual(new Relocatable(1, 0));
    });
    test('add 2', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Add2,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.runContext.ap).toEqual(new Relocatable(1, 2));
    });
    test('add 1', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Add1,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.runContext.ap).toEqual(new Relocatable(1, 1));
    });
    test('add res felt', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Add,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(5n),
        dst: undefined,
      };

      vm.updateAp(instruction, operands);
      expect(vm.runContext.ap).toEqual(new Relocatable(1, 5));
    });
    test('add res relocatable', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Add,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 0),
        dst: undefined,
      };

      const { error } = vm.updateAp(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(ExpectedFelt));
    });
    test('add no res', () => {
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Add,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      const { error } = vm.updateAp(instruction, operands);
      expect(error).toEqual(new VirtualMachineError(UnconstrainedResError));
    });
  });

  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L122
  describe('updateRegisters', () => {
    test('should keep ap/fp the same', () => {
      const vm = new VirtualMachine();
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );
      const operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      const { error } = vm.updateRegisters(instruction, operands);
      expect(error).toBeUndefined();

      expect(vm.runContext).toEqual(new RunContext(1, 0, 0));
    });
    test('should update the register with mixed types', () => {
      const vm = new VirtualMachine();
      vm.runContext = new RunContext(4, 5, 6);
      const instruction = new Instruction(
        0 as Int16,
        0 as Int16,
        0 as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Unconstrained,
        PcUpdate.JumpRel,
        ApUpdate.Add2,
        FpUpdate.Dst,
        Opcode.NoOp
      );
      const operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(8n),
        dst: new Relocatable(1, 11),
      };

      const { error } = vm.updateRegisters(instruction, operands);
      expect(error).toBeUndefined();

      expect(vm.runContext).toEqual(new RunContext(12, 7, 11));
    });
  });
});
