import { test, expect, describe, spyOn } from 'bun:test';

import { ExpectedFelt, ExpectedRelocatable } from 'errors/primitives';
import {
  DictNotFound,
  DictValueNotFound,
  InvalidBufferResOp,
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
  Op1Src,
} from './instruction';
import { Dictionnary, VirtualMachine } from './virtualMachine';
import { CellRef, Operation, OpType, ResOp } from 'hints/hintParamsSchema';

const instructions = {
  InvalidAssertEq: new Instruction(
    1,
    2,
    3,
    Register.Fp,
    Register.Ap,
    Op1Src.Ap,
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
    Op1Src.Ap,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Pc,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Pc,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
    Op1Src.Ap,
    ResLogic.Op1,
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
      const res = undefined;
      const dst = undefined;

      vm.updatePc(instruction, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });

    test('regular with imm', () => {
      const instruction = instructions.RegularImm;

      const vm = new VirtualMachine();
      const res = undefined;
      const dst = undefined;

      vm.updatePc(instruction, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 2));
    });

    test('jmp res relocatable', () => {
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const res = new Relocatable(0, 5);
      const dst = undefined;

      vm.updatePc(instruction, res, dst);
      vm.updatePc(instruction, res, dst);
      expect(vm.pc).toEqual(res);
    });

    test('jmp res felt', () => {
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const res = new Felt(0n);
      const dst = undefined;

      expect(() => vm.updatePc(instruction, res, dst)).toThrow(
        new ExpectedRelocatable(res)
      );
    });

    test('jmp without res', () => {
      const instruction = instructions.Jump;

      const vm = new VirtualMachine();
      const res = undefined;
      const dst = undefined;

      expect(() => vm.updatePc(instruction, res, dst)).toThrow(new UnusedRes());
    });

    test('jmp rel res felt', () => {
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const res = new Felt(5n);
      const dst = undefined;

      vm.updatePc(instruction, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 5));
    });

    test('jmp rel res relocatable', () => {
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const res = new Relocatable(0, 5);
      const dst = undefined;

      expect(() => vm.updatePc(instruction, res, dst)).toThrow(
        new ExpectedFelt(res)
      );
    });

    test('jmp rel res relocatable', () => {
      const instruction = instructions.JumpRel;

      const vm = new VirtualMachine();
      const res = undefined;
      const dst = undefined;

      expect(() => vm.updatePc(instruction, res, dst)).toThrow(new UnusedRes());
    });

    test('jnz des is zero no imm', () => {
      const instruction = instructions.Jnz;

      const vm = new VirtualMachine();
      const res = undefined;
      const dst = new Felt(0n);

      vm.updatePc(instruction, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 1));
    });

    test('jnz des is zero imm', () => {
      const instruction = instructions.JnzImm;

      const vm = new VirtualMachine();
      const res = undefined;
      const dst = new Felt(0n);

      vm.updatePc(instruction, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 2));
    });

    test('jnz dst not zero op1 felt', () => {
      const instruction = instructions.Jnz;

      const vm = new VirtualMachine();
      const res = new Felt(3n);
      const dst = new Felt(1n);

      vm.updatePc(instruction, res, dst);
      expect(vm.pc).toEqual(new Relocatable(0, 3));
    });

    test('jnz dst not zero op1 relocatable', () => {
      const instruction = instructions.Jnz;

      const vm = new VirtualMachine();
      const res = new Relocatable(0, 0);
      const dst = new Felt(1n);

      expect(() => vm.updatePc(instruction, res, dst)).toThrow(
        new ExpectedFelt(res)
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

      expect(() => vm.updateAp(instruction, res)).toThrow(
        new ExpectedFelt(res)
      );
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
      const res = undefined;
      const dst = undefined;

      vm.updateRegisters(instruction, res, dst);
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

      const res = new Felt(8n);
      const dst = new Relocatable(1, 11);

      vm.updateRegisters(instruction, res, dst);
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

  describe('hint processor', () => {
    describe('cellRefToRelocatable', () => {
      test.each([
        [{ register: Register.Ap, offset: 0 }, new Relocatable(1, 0)],
        [{ register: Register.Ap, offset: 5 }, new Relocatable(1, 5)],
        [{ register: Register.Fp, offset: 3 }, new Relocatable(1, 3)],
      ])(
        'should properly read the cellRef',
        (cellRef: CellRef, expected: Relocatable) => {
          const vm = new VirtualMachine();
          expect(vm.cellRefToRelocatable(cellRef)).toEqual(expected);
        }
      );

      test('should properly read a Felt', () => {
        const vm = new VirtualMachine();
        vm.memory.addSegment();
        vm.memory.addSegment();
        const value = new Felt(10n);
        const cellRef: CellRef = { register: Register.Ap, offset: 0 };
        vm.memory.assertEq(vm.ap, value);
        expect(vm.getFelt(cellRef)).toEqual(value);
      });

      test('should properly read a Relocatable', () => {
        const vm = new VirtualMachine();
        vm.memory.addSegment();
        vm.memory.addSegment();
        const value = new Relocatable(0, 10);
        const cellRef: CellRef = { register: Register.Ap, offset: 0 };
        vm.memory.assertEq(vm.ap, value);
        expect(vm.getRelocatable(cellRef)).toEqual(value);
      });

      test('should throw when reading a Relocatable as a Felt', () => {
        const vm = new VirtualMachine();
        vm.memory.addSegment();
        vm.memory.addSegment();
        const value = new Relocatable(0, 10);
        const cellRef: CellRef = { register: Register.Ap, offset: 0 };
        vm.memory.assertEq(vm.ap, value);
        expect(() => vm.getFelt(cellRef)).toThrow(new ExpectedFelt(value));
      });

      test('should throw when reading a Felt as a Relocatable', () => {
        const vm = new VirtualMachine();
        vm.memory.addSegment();
        vm.memory.addSegment();
        const value = new Felt(10n);
        const cellRef: CellRef = { register: Register.Ap, offset: 0 };
        vm.memory.assertEq(vm.ap, value);
        expect(() => vm.getRelocatable(cellRef)).toThrow(
          new ExpectedRelocatable(value)
        );
      });

      test('should properly read a pointer', () => {
        const vm = new VirtualMachine();
        vm.memory.addSegment();
        vm.memory.addSegment();
        const cell: CellRef = { register: Register.Ap, offset: 0 };
        const offset = new Felt(3n);
        const value = new Relocatable(0, 4);
        vm.memory.assertEq(vm.ap, value);
        expect(vm.getPointer(cell, offset)).toEqual(value.add(offset));
      });

      test.each([
        [
          {
            type: OpType.Deref,
            cell: { register: Register.Ap, offset: 0 },
          },
          [{ register: Register.Ap, offset: 0 }, new Felt(0n)],
        ],
        [
          {
            type: OpType.BinOp,
            op: Operation.Add,
            a: { register: Register.Fp, offset: 2 },
            b: { type: OpType.Immediate, value: new Felt(5n) },
          },
          [{ register: Register.Fp, offset: 2 }, new Felt(5n)],
        ],
      ])('should properly extract a buffer', (resOp: ResOp, expected) => {
        const vm = new VirtualMachine();
        expect(vm.extractBuffer(resOp)).toEqual(expected as [CellRef, Felt]);
      });

      test.each([
        {
          type: OpType.DoubleDeref,
          cell: { register: Register.Ap, offset: 0 },
          offset: 1,
        },

        {
          type: OpType.BinOp,
          op: Operation.Add,
          a: { register: Register.Fp, offset: 2 },
          b: {
            type: OpType.Deref,
            cell: { register: Register.Ap, offset: 5 },
          },
        },

        {
          type: OpType.BinOp,
          op: Operation.Add,
          a: { register: Register.Fp, offset: 2 },
          b: {
            type: OpType.Deref,
            cell: { register: Register.Ap, offset: 5 },
          },
        },
        {
          type: OpType.Immediate,
          value: new Felt(4n),
        },
      ])(
        'should throw when extracting a buffer with the wrong resOp',
        (resOp: ResOp) => {
          const vm = new VirtualMachine();
          expect(() => vm.extractBuffer(resOp)).toThrow(
            new InvalidBufferResOp(resOp)
          );
        }
      );

      test.each([
        [
          {
            type: OpType.Deref,
            cell: { register: Register.Ap, offset: 0 },
          },
          new Felt(3n),
        ],
        [
          {
            type: OpType.DoubleDeref,
            cell: { register: Register.Ap, offset: 2 },
            offset: 1,
          },
          new Felt(7n),
        ],
        [
          {
            type: OpType.Immediate,
            value: new Felt(5n),
          },
          new Felt(5n),
        ],
        [
          {
            type: OpType.BinOp,
            op: Operation.Add,
            a: { register: Register.Fp, offset: 0 },
            b: { type: OpType.Immediate, value: new Felt(5n) },
          },
          new Felt(8n),
        ],
        [
          {
            type: OpType.BinOp,
            op: Operation.Mul,
            a: { register: Register.Fp, offset: 0 },
            b: { type: OpType.Immediate, value: new Felt(5n) },
          },
          new Felt(15n),
        ],
        [
          {
            type: OpType.BinOp,
            op: Operation.Add,
            a: { register: Register.Ap, offset: 0 },
            b: {
              type: OpType.Deref,
              cell: { register: Register.Ap, offset: 1 },
            },
          },
          new Felt(10n),
        ],
        [
          {
            type: OpType.BinOp,
            op: Operation.Mul,
            a: { register: Register.Ap, offset: 0 },
            b: {
              type: OpType.Deref,
              cell: { register: Register.Ap, offset: 1 },
            },
          },
          new Felt(21n),
        ],
      ])('should properly read ResOp', (resOp: ResOp, expected: Felt) => {
        const vm = new VirtualMachine();
        vm.memory.addSegment();
        vm.memory.addSegment();
        const value0 = new Felt(3n);
        const value1 = new Felt(7n);
        const address = new Relocatable(1, 0);
        vm.memory.assertEq(vm.ap, value0);
        vm.memory.assertEq(vm.ap.add(1), value1);
        vm.memory.assertEq(vm.ap.add(2), address);
        expect(vm.getResOperandValue(resOp)).toEqual(expected);
      });
    });
  });

  describe('Dictionnary', () => {
    test('should properly initialize the dict manager', () => {
      const vm = new VirtualMachine();
      expect(vm.dictManager.size).toEqual(0);
    });

    test('should properly create a new dictionnary', () => {
      const vm = new VirtualMachine();
      const address = vm.newDict();
      expect(address).toEqual(new Relocatable(0, 0));
      expect(vm.getDict(address)).toEqual(new Dictionnary(new Felt(0n)));
    });

    test('should properly set and get value of a dictionnary', () => {
      const vm = new VirtualMachine();
      const address = vm.newDict();
      const key = new Felt(12n);
      const value = new Felt(5n);
      vm.setDictValue(address, key, value);
      expect(vm.getDictValue(address, key)).toEqual(value);
    });

    test('should throw DictNotFound when accessing a non-existing dictionnary', () => {
      const vm = new VirtualMachine();
      const address = new Relocatable(2, 3);
      expect(() => vm.getDict(address)).toThrow(new DictNotFound(address));
    });

    test('should throw DictValueNotFound when accessing a non-existing key in a dictionnary', () => {
      const vm = new VirtualMachine();
      const address = vm.newDict();
      const key = new Felt(0n);
      expect(() => vm.getDictValue(address, key)).toThrow(
        new DictValueNotFound(address, key)
      );
    });
  });
});
