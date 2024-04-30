import { test, expect, describe } from 'bun:test';
import {
  Instruction,
  Op1Source,
  Opcode,
  ResLogic,
  Register,
  PcUpdate,
  ApUpdate,
  FpUpdate,
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
  Op0NotRelocatable,
  Op0Undefined,
  Op1ImmediateOffsetError,
} from 'errors/virtualMachine';

function getInstructionWithOpcodeAndResLogic(
  opcode: Opcode,
  resLogic: ResLogic
): Instruction {
  const instruction = Instruction.default();
  instruction.opcode = opcode;
  instruction.resLogic = resLogic;
  return instruction;
}

const instructionFromOpcodeAndResLogic = {
  CallUnused: getInstructionWithOpcodeAndResLogic(Opcode.Call, ResLogic.Unused),
  RetAdd: getInstructionWithOpcodeAndResLogic(Opcode.Ret, ResLogic.Add),
  AssertEqOp1: getInstructionWithOpcodeAndResLogic(
    Opcode.AssertEq,
    ResLogic.Op1
  ),
  AssertEqAdd: getInstructionWithOpcodeAndResLogic(
    Opcode.AssertEq,
    ResLogic.Add
  ),
  AssertEqMul: getInstructionWithOpcodeAndResLogic(
    Opcode.AssertEq,
    ResLogic.Mul
  ),
  AssertEqUnused: getInstructionWithOpcodeAndResLogic(
    Opcode.AssertEq,
    ResLogic.Unused
  ),
};

const instructions = {
  InvalidAssertEq: new Instruction(
    1,
    2,
    3,
    Register.Fp,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Add,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.Ap2,
    Opcode.AssertEq
  ),
  InvalidCall: new Instruction(
    1,
    2,
    3,
    Register.Fp,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Add,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.Ap2,
    Opcode.Call
  ),
  Regular: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  RegularImm: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Pc,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  Jump: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Jump,
    ApUpdate.Ap,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  JumpRel: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.JumpRel,
    ApUpdate.Ap,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  JumpRelAdd2: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.JumpRel,
    ApUpdate.Add2,
    FpUpdate.Dst,
    Opcode.NoOp
  ),
  Jnz: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Jnz,
    ApUpdate.Ap,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  JnzImm: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Pc,
    ResLogic.Unused,
    PcUpdate.Jnz,
    ApUpdate.Ap,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  Dst: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.Dst,
    Opcode.NoOp
  ),
  ApPlus2: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.Ap2,
    Opcode.NoOp
  ),
  Add2: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.Add2,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  Add1: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.Add1,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
  AddRes: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Op1Source.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.AddRes,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
};

describe('VirtualMachine', () => {
  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L16
  describe('deduceOp0', () => {
    test('should return undefined for return opcode', () => {
      const instruction = instructionFromOpcodeAndResLogic.RetAdd;
      const vm = new VirtualMachine();

      const op0 = vm.deduceOp0(instruction, undefined, undefined);
      expect(op0).toBeUndefined();
    });

    test('should deduce op0 for assert eq res logic mul', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(3n);

      const op0 = vm.deduceOp0(instruction, dst, op1);
      expect(op0).toEqual(new Felt(2n));
    });

    test('should return undefined for assert eq res logic mul with op1 = 0', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();
      const dst = new Felt(6n);
      const op1 = new Felt(0n);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toBeUndefined();
    });

    test('should return undefined for assert eq res logic mul with relocatables', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 2);
      const op1 = new Relocatable(1, 3);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toBeUndefined();
    });

    test('should return undefined for assert eq res logic mul with undefined', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();

      const value = vm.deduceOp0(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op0 and res for assert eq res logic add with felts', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqAdd;
      const vm = new VirtualMachine();
      const dst = new Felt(7n);
      const op1 = new Felt(5n);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toEqual(new Felt(2n));
    });

    test('should deduce op0 and res for assert eq res logic add with relocatables', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqAdd;
      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 6);
      const op1 = new Relocatable(1, 2);

      const value = vm.deduceOp0(instruction, dst, op1);
      expect(value).toEqual(new Felt(4n));
    });

    test('should return undefined for assert eq res logic add with undefined dst and op1', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqAdd;
      const vm = new VirtualMachine();

      const value = vm.deduceOp0(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op0 for call', () => {
      const instruction = instructionFromOpcodeAndResLogic.CallUnused;
      const vm = new VirtualMachine();

      const value = vm.deduceOp0(instruction, undefined, undefined);
      expect(value).toEqual(new Relocatable(0, 1));
    });
  });

  describe('deduceOp1', () => {
    test('should return undefined for return opcode', () => {
      const instruction = instructionFromOpcodeAndResLogic.RetAdd;
      const vm = new VirtualMachine();

      const op1 = vm.deduceOp1(instruction, undefined, undefined);
      expect(op1).toBeUndefined();
    });

    test('should deduce op1 for assert eq res logic add', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqAdd;
      const vm = new VirtualMachine();
      const dst = new Felt(3n);
      const op0 = new Felt(2n);

      const op1 = vm.deduceOp1(instruction, dst, op0);
      expect(op1).toEqual(new Felt(1n));
    });

    test('should return undefined for assert eq res logic add with op0 and dst undefined', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();

      const value = vm.deduceOp1(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op1 for assert eq res logic mul with felts', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();
      const dst = new Felt(4n);
      const op0 = new Felt(2n);

      const op1 = vm.deduceOp1(instruction, dst, op0);
      expect(op1).toEqual(new Felt(2n));
    });

    test('should return undefined for assert eq res logic mul with op0 = 0', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();
      const dst = new Felt(4n);
      const op0 = new Felt(0n);

      const value = vm.deduceOp1(instruction, dst, op0);
      expect(value).toBeUndefined();
    });

    test('should deduce op1 and res for assert eq res logic op1 with dst undefined', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqOp1;
      const vm = new VirtualMachine();

      const value = vm.deduceOp1(instruction, undefined, undefined);
      expect(value).toBeUndefined();
    });

    test('should deduce op1 and res for assert eq res logic op1 with dst', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqOp1;
      const vm = new VirtualMachine();
      const dst = new Felt(7n);

      const value = vm.deduceOp1(instruction, dst, undefined);
      expect(value).toEqual(dst);
    });
  });

  describe('computeRes', () => {
    test('should deduce res with res logic op1', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqOp1;
      const vm = new VirtualMachine();
      const op0 = new Felt(2n);
      const op1 = new Felt(2n);

      const res = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(op1);
    });
    test('should deduce res with res logic add with op0 and op1 felts', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqAdd;
      const vm = new VirtualMachine();
      const op0 = new Felt(5n);
      const op1 = new Felt(2n);

      const res = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(new Felt(7n));
    });
    test('should throw an error with res logic add with op0 and op1 relocatables', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqAdd;
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      expect(() => vm.computeRes(instruction, op0, op1)).toThrow(
        new ForbiddenOperation()
      );
    });
    test('should deduce res with res logic mul with op0 and op1 felts', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();
      const op0 = new Felt(5n);
      const op1 = new Felt(2n);

      const res = vm.computeRes(instruction, op0, op1);
      expect(res).toEqual(new Felt(10n));
    });
    test('should throw an error with res logic mul with op0 and op1 relocatables', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqMul;
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      expect(() => vm.computeRes(instruction, op0, op1)).toThrow(
        new ExpectedFelt()
      );
    });
    test('should return undefined with res logic unconstrained', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqUnused;
      const vm = new VirtualMachine();
      const op0 = new Relocatable(1, 5);
      const op1 = new Relocatable(1, 2);

      const value = vm.computeRes(instruction, op0, op1);
      expect(value).toBeUndefined();
    });
  });

  describe('deduceDst', () => {
    test('should deduce dst for assert eq with res', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqUnused;
      const vm = new VirtualMachine();
      const res = new Felt(5n);

      const dst = vm.deduceDst(instruction, res);
      expect(dst).toEqual(res);
    });
    test('should deduce dst for call', () => {
      const instruction = instructionFromOpcodeAndResLogic.CallUnused;
      const vm = new VirtualMachine();
      const res = new Felt(5n);

      const dst = vm.deduceDst(instruction, res);
      expect(dst).toEqual(new Relocatable(1, 0));
    });
    test('should return undefined for assert eq with res undefined', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqUnused;
      const vm = new VirtualMachine();

      const dst = vm.deduceDst(instruction, undefined);
      expect(dst).toBeUndefined();
    });
    test('should return undefined dst for ret', () => {
      const instruction = instructionFromOpcodeAndResLogic.AssertEqUnused;
      const vm = new VirtualMachine();

      const dst = vm.deduceDst(instruction, undefined);
      expect(dst).toBeUndefined();
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L572
  describe('opcodeAssertions', () => {
    test('should throw UnconstrainedResError on assert eq opcode and undefined res operand', () => {
      const instruction: Instruction = instructions.InvalidAssertEq;

      const operands: Operands = {
        dst: new Felt(8n),
        res: undefined,
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new UnconstrainedResError()
      );
    });
    test('should throw DiffAssertError on assert eq opcode and res != dst felts', () => {
      const instruction: Instruction = instructions.InvalidAssertEq;

      const operands: Operands = {
        dst: new Felt(9n),
        res: new Felt(8n),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new DiffAssertValuesError()
      );
    });
    test('should throw DiffAssertError on assert eq opcode and res != dst relocatables', () => {
      const instruction: Instruction = instructions.InvalidAssertEq;

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new DiffAssertValuesError()
      );
    });
    test('should throw InvalidOp0 on call opcode and pc != op0', () => {
      const instruction: Instruction = instructions.InvalidCall;

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new InvalidOp0()
      );
    });
    test('should throw InvalidDstError on call opcode and fp != dst', () => {
      const instruction: Instruction = instructions.InvalidCall;

      const operands: Operands = {
        dst: new Relocatable(1, 2),
        res: new Relocatable(1, 3),
        op0: new Relocatable(0, 1),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new InvalidDstOperand()
      );
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L284
  describe('updatePc', () => {
    test('regular', () => {
      const instruction = instructions.Regular;

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
      const instruction = instructions.RegularImm;

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
      const instruction = instructions.Jump;

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
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Felt(0n),
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new ExpectedRelocatable()
      );
    });
    test('jmp without res', () => {
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new UnconstrainedResError()
      );
    });
    test('jmp rel res felt', () => {
      const instruction = instructions.JumpRel;

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
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 5),
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new ExpectedFelt()
      );
    });
    test('jmp rel res relocatable', () => {
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new UnconstrainedResError()
      );
    });
    test('jnz des is zero no imm', () => {
      const instruction = instructions.Jnz;

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
      const instruction = instructions.JnzImm;

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
      const instruction = instructions.Jnz;

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
      const instruction = instructions.Jnz;

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: new Relocatable(0, 0),
        res: undefined,
        dst: new Felt(1n),
      };

      expect(() => vm.updatePc(instruction, operands)).toThrow(
        new ExpectedFelt()
      );
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L160
  describe('updateFp', () => {
    test('regular', () => {
      const instruction = instructions.Regular;

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
      const instruction = instructions.Dst;

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
      const instruction = instructions.Dst;

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
      const instruction = instructions.ApPlus2;

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
      const instruction = instructions.Regular;

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
      const instruction = instructions.Add2;

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
      const instruction = instructions.Add1;

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
      const instruction = instructions.AddRes;

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
      const instruction = instructions.AddRes;

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: new Relocatable(0, 0),
        dst: undefined,
      };

      expect(() => vm.updateAp(instruction, operands)).toThrow(
        new ExpectedFelt()
      );
    });
    test('add no res', () => {
      const instruction = instructions.AddRes;

      const vm = new VirtualMachine();
      const operands: Operands = {
        op0: undefined,
        op1: undefined,
        res: undefined,
        dst: undefined,
      };

      expect(() => vm.updateAp(instruction, operands)).toThrow(
        new UnconstrainedResError()
      );
    });
  });

  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L122
  describe('updateRegisters', () => {
    test('should keep ap/fp the same', () => {
      const instruction = instructions.Regular;

      const vm = new VirtualMachine();
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
      const instruction = instructions.JumpRelAdd2;
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

      const op1Addr = vm.computeOp1Address(Op1Source.Fp, 1, undefined);

      expect(op1Addr.segment).toEqual(1);
      expect(op1Addr.offset).toEqual(7);
    });

    test('should compute op1 addr for ap register', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      const op1Addr = vm.computeOp1Address(Op1Source.Ap, 1, undefined);

      expect(op1Addr.segment).toEqual(1);
      expect(op1Addr.offset).toEqual(6);
    });

    test('should compute op1 addr for op1 src imm', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      const op1Addr = vm.computeOp1Address(Op1Source.Pc, 1, undefined);

      expect(op1Addr.segment).toEqual(0);
      expect(op1Addr.offset).toEqual(5);
    });

    test('should throw an error Op1ImmediateOffsetError for op1 src imm with incorrect offset', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      expect(() => vm.computeOp1Address(Op1Source.Pc, 2, undefined)).toThrow(
        new Op1ImmediateOffsetError()
      );
    });

    test('should compute op1 addr for op1 src op0 with op0 relocatable', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      const op1Addr = vm.computeOp1Address(
        Op1Source.Op0,
        1,
        new Relocatable(1, 7)
      );

      expect(op1Addr.segment).toEqual(1);
      expect(op1Addr.offset).toEqual(8);
    });

    test('should throw an error Op0NotRelocatable for op1 src op0 with op0 felt', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      expect(() =>
        vm.computeOp1Address(Op1Source.Op0, 1, new Felt(7n))
      ).toThrow(new Op0NotRelocatable());
    });

    test('should throw an error Op0Undefined for op1 src op0 with op0 undefined', () => {
      const vm = new VirtualMachine();
      vm.setRegisters(4, 5, 6);

      expect(() => vm.computeOp1Address(Op1Source.Op0, 1, undefined)).toThrow(
        new Op0Undefined()
      );
    });
  });
});
