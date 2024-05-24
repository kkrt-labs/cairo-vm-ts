import { test, expect, describe, spyOn } from 'bun:test';

import {
  ExpectedFelt,
  ExpectedRelocatable,
  UnusedRes,
} from 'errors/virtualMachine';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import {
  Instruction,
  Opcode,
  ResLogic,
  Register,
  PcUpdate,
  ApUpdate,
  FpUpdate,
} from './instruction';
import { VirtualMachine } from './virtualMachine';

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
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L284
  describe('updatePc', () => {
    test('regular', () => {
      const instruction = instructions.Regular;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = undefined;
      const dst = undefined;

      vm.updatePc(instruction, op1, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });

    test('regular with imm', () => {
      const instruction = instructions.RegularImm;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = undefined;
      const dst = undefined;

      vm.updatePc(instruction, op1, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 2));
    });

    test('jmp res relocatable', () => {
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = new Relocatable(0, 5);
      const dst = undefined;

      vm.updatePc(instruction, op1, res, dst);
      vm.updatePc(instruction, op1, res, dst);
      expect(vm.pc).toEqual(res);
    });

    test('jmp res felt', () => {
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = new Felt(0n);
      const dst = undefined;

      expect(() => vm.updatePc(instruction, op1, res, dst)).toThrow(
        new ExpectedRelocatable()
      );
    });

    test('jmp without res', () => {
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = undefined;
      const dst = undefined;

      expect(() => vm.updatePc(instruction, op1, res, dst)).toThrow(
        new UnusedRes()
      );
    });

    test('jmp rel res felt', () => {
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = new Felt(5n);
      const dst = undefined;

      vm.updatePc(instruction, op1, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 5));
    });

    test('jmp rel res relocatable', () => {
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = new Relocatable(0, 5);
      const dst = undefined;

      expect(() => vm.updatePc(instruction, op1, res, dst)).toThrow(
        new ExpectedFelt()
      );
    });

    test('jmp rel res relocatable', () => {
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = undefined;
      const dst = undefined;

      expect(() => vm.updatePc(instruction, op1, res, dst)).toThrow(
        new UnusedRes()
      );
    });

    test('jnz des is zero no imm', () => {
      const instruction = instructions.Jnz;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = undefined;
      const dst = new Felt(0n);

      vm.updatePc(instruction, op1, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });

    test('jnz des is zero imm', () => {
      const instruction = instructions.JnzImm;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = undefined;
      const dst = new Felt(0n);

      vm.updatePc(instruction, op1, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 2));
    });

    test('jnz des not zero op1 felt', () => {
      const instruction = instructions.Jnz;

      const vm = new VirtualMachine();
      const op1 = new Felt(3n);
      const res = undefined;
      const dst = new Felt(1n);

      vm.updatePc(instruction, op1, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 3));
    });

    test('jnz des not zero op1 relocatable', () => {
      const instruction = instructions.Jnz;

      const vm = new VirtualMachine();
      const op1 = new Relocatable(0, 0);
      const res = undefined;
      const dst = new Felt(1n);

      expect(() => vm.updatePc(instruction, op1, res, dst)).toThrow(
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
      const dst = undefined;

      vm.updateFp(instruction, dst);
      expect(vm.fp).toEqual(new Relocatable(1, 0));
    });

    test('dst felt', () => {
      const instruction = instructions.Dst;

      const vm = new VirtualMachine();
      const dst = new Felt(9n);

      vm.updateFp(instruction, dst);
      expect(vm.fp).toEqual(new Relocatable(1, 9));
    });

    test('dst relocatable', () => {
      const instruction = instructions.Dst;

      const vm = new VirtualMachine();
      const dst = new Relocatable(1, 9);

      vm.updateFp(instruction, dst);
      expect(vm.fp).toEqual(new Relocatable(1, 9));
    });

    test('ap plus 2', () => {
      const instruction = instructions.ApPlus2;

      const vm = new VirtualMachine();
      vm.ap = new Relocatable(1, 7);
      const dst = undefined;

      vm.updateFp(instruction, dst);
      expect(vm.fp).toEqual(new Relocatable(1, 9));
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L213
  describe('updateAp', () => {
    test('regular', () => {
      const instruction = instructions.Regular;

      const vm = new VirtualMachine();
      const res = undefined;

      vm.updateAp(instruction, res);
      expect(vm.ap).toEqual(new Relocatable(1, 0));
    });

    test('add 2', () => {
      const instruction = instructions.Add2;

      const vm = new VirtualMachine();
      const res = undefined;

      vm.updateAp(instruction, res);
      expect(vm.ap).toEqual(new Relocatable(1, 2));
    });

    test('add 1', () => {
      const instruction = instructions.Add1;

      const vm = new VirtualMachine();
      const res = undefined;

      vm.updateAp(instruction, res);
      expect(vm.ap).toEqual(new Relocatable(1, 1));
    });

    test('add res felt', () => {
      const instruction = instructions.AddRes;

      const vm = new VirtualMachine();
      const res = new Felt(5n);

      vm.updateAp(instruction, res);
      expect(vm.ap).toEqual(new Relocatable(1, 5));
    });

    test('add res relocatable', () => {
      const instruction = instructions.AddRes;

      const vm = new VirtualMachine();
      const res = new Relocatable(0, 0);

      expect(() => vm.updateAp(instruction, res)).toThrow(new ExpectedFelt());
    });

    test('add no res', () => {
      const instruction = instructions.AddRes;

      const vm = new VirtualMachine();
      const res = undefined;

      expect(() => vm.updateAp(instruction, res)).toThrow(new UnusedRes());
    });
  });

  // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/vm_test.go#L122
  describe('updateRegisters', () => {
    test('should keep ap/fp the same', () => {
      const instruction = instructions.Regular;

      const vm = new VirtualMachine();
      const op1 = undefined;
      const res = undefined;
      const dst = undefined;

      vm.updateRegisters(instruction, op1, res, dst);
      expect(vm.ap).toEqual(new Relocatable(1, 0));
      expect(vm.fp).toEqual(new Relocatable(1, 0));
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });

    test('should update the register with mixed types', () => {
      const vm = new VirtualMachine();
      vm.pc = new Relocatable(0, 4);
      vm.ap = new Relocatable(1, 5);
      vm.fp = new Relocatable(1, 6);
      const instruction = instructions.JumpRelAdd2;

      const op1 = undefined;
      const res = new Felt(8n);
      const dst = new Relocatable(1, 11);

      vm.updateRegisters(instruction, op1, res, dst);
      const registers = {
        pc: new Relocatable(0, 12),
        ap: new Relocatable(1, 7),
        fp: new Relocatable(1, 11),
      };
      expect({ ap: vm.ap, fp: vm.fp, pc: vm.pc }).toEqual(registers);
    });
  });

  describe('relocatedMemoryToString', () => {
    test('should properly print relocated memory', () => {
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();

      const addresses = [
        new Relocatable(0, 0),
        new Relocatable(0, 2),
        new Relocatable(1, 0),
      ];
      const values = [new Felt(1n), new Felt(2n), new Relocatable(0, 2)];
      vm.memory.assertEq(addresses[0], values[0]);
      vm.memory.assertEq(addresses[1], values[1]);
      vm.memory.assertEq(addresses[2], values[2]);

      vm.relocate();

      const expectedStr = [
        '\nRELOCATED MEMORY',
        'Address  ->  Value',
        '-----------------',
        `0 -> 1`,
        `2 -> 2`,
        `3 -> 2`,
      ].join('\n');

      const logSpy = spyOn(vm, 'relocatedMemoryToString');

      vm.relocatedMemoryToString();

      expect(logSpy.mock.results[0].value).toEqual(expectedStr);
    });
  });
});
