import { test, expect, describe } from 'bun:test';
import {
  Instruction,
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
import {
  DiffAssertValuesError,
  ExpectedFelt,
  ExpectedRelocatable,
  InvalidDstOperand,
  InvalidOp0,
  UnusedResError,
} from 'errors/virtualMachine';

const instructions = {
  InvalidAssertEq: new Instruction(
    1,
    2,
    3,
    Register.Fp,
    Register.Ap,
    Register.Ap,
    ResLogic.Add,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.ApPlus2,
    Opcode.AssertEq
  ),
  InvalidCall: new Instruction(
    1,
    2,
    3,
    Register.Fp,
    Register.Ap,
    Register.Ap,
    ResLogic.Add,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.ApPlus2,
    Opcode.Call
  ),
  Regular: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Register.Ap,
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
    Register.Pc,
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
    Register.Ap,
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
    Register.Ap,
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
    Register.Ap,
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
    Register.Ap,
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
    Register.Pc,
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
    Register.Ap,
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
    Register.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.Ap,
    FpUpdate.ApPlus2,
    Opcode.NoOp
  ),
  Add2: new Instruction(
    0,
    0,
    0,
    Register.Ap,
    Register.Ap,
    Register.Ap,
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
    Register.Ap,
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
    Register.Ap,
    ResLogic.Unused,
    PcUpdate.Regular,
    ApUpdate.AddRes,
    FpUpdate.Fp,
    Opcode.NoOp
  ),
};

describe('VirtualMachine', () => {
  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L572
  describe('opcodeAssertions', () => {
    test('should throw UnusedResError on assert eq opcode and undefined res operand', () => {
      const instruction: Instruction = instructions.InvalidAssertEq;

      const operands: Operands = {
        dst: new Felt(8n),
        res: undefined,
        op0: new Felt(9n),
        op1: new Felt(10n),
      };
      const vm = new VirtualMachine();

      expect(() => vm.opcodeAssertion(instruction, operands)).toThrow(
        new UnusedResError()
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
        new UnusedResError()
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
        new UnusedResError()
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
        new UnusedResError()
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
});
