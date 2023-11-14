import { test, expect, describe } from 'bun:test';
import {
  Instruction,
  Opcode,
  ResLogic,
  Op1Src,
  PcUpdate,
  ApUpdate,
  FpUpdate,
  RegisterFlag,
} from './instruction';
import { Operands, VirtualMachine } from './virtualMachine';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { BaseError, ErrorType } from 'result/error';
import { ForbiddenOperation } from 'result/primitives';
import { Int16 } from 'primitives/int';
import {
  DiffAssertValuesError,
  InvalidDstOperand,
  InvalidOperand0,
  UnconstrainedResError,
} from 'result/virtualMachine';

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
      expect(error).toEqual(
        new BaseError(ErrorType.RelocatableError, ForbiddenOperation)
      );
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
      expect(error).toEqual(
        new BaseError(ErrorType.RelocatableError, ForbiddenOperation)
      );
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
      expect(error).toEqual(
        new BaseError(ErrorType.VMError, UnconstrainedResError)
      );
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
      expect(error).toEqual(
        new BaseError(ErrorType.VMError, DiffAssertValuesError)
      );
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
      expect(error).toEqual(
        new BaseError(ErrorType.VMError, DiffAssertValuesError)
      );
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
      expect(error).toEqual(new BaseError(ErrorType.VMError, InvalidOperand0));
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
      expect(error).toEqual(
        new BaseError(ErrorType.VMError, InvalidDstOperand)
      );
    });
  });
});
