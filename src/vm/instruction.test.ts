import { test, expect, describe } from 'bun:test';
import { UnsignedInteger } from 'primitives/uint';
import {
  ApUpdate,
  decodeInstruction,
  FpUpdate,
  Instruction,
  Op1Src,
  Opcode,
  PcUpdate,
  RegisterFlag,
  ResLogic,
} from './instruction';
import { SignedInteger16 } from 'primitives/int';

describe('Instruction', () => {
  describe('decodeInstruction', () => {
    test('should correctly decode the cairo instruction [ap + 10] = [fp] + 42', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = 10n + BIAS;
      const offOp0 = BIAS << shift;
      const offOp1 = (1n + BIAS) << (2n * shift);

      const flag = 0b0100000000100110n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const encodedInstructionUint64 =
        UnsignedInteger.toUint64(encodedInstruction).unwrap();
      const instruction = decodeInstruction(encodedInstructionUint64).unwrap();

      const expected: Instruction = {
        offDst: SignedInteger16.toInt16(10),
        offOp0: SignedInteger16.toInt16(0),
        offOp1: SignedInteger16.toInt16(1),
        dstReg: RegisterFlag.ApRegisterFlag,
        op0Reg: RegisterFlag.FpRegisterFlag,
        op1Src: Op1Src.Imm,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.Regular,
        apUpdate: ApUpdate.Regular,
        fpUpdate: FpUpdate.Regular,
        opcode: Opcode.AssertEq,
      };

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction jmp rel [fp - 1] if [fp - 7] != 0', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = -7n + BIAS;
      const offOp0 = (BIAS - 1n) << shift;
      const offOp1 = (BIAS - 1n) << (2n * shift);

      const flag = 0b0000001000001011n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const encodedInstructionUint64 =
        UnsignedInteger.toUint64(encodedInstruction).unwrap();
      const instruction = decodeInstruction(encodedInstructionUint64).unwrap();

      const expected: Instruction = {
        offDst: SignedInteger16.toInt16(-7),
        offOp0: SignedInteger16.toInt16(-1),
        offOp1: SignedInteger16.toInt16(-1),
        dstReg: RegisterFlag.FpRegisterFlag,
        op0Reg: RegisterFlag.FpRegisterFlag,
        op1Src: Op1Src.FP,
        resLogic: ResLogic.Unconstrained,
        pcUpdate: PcUpdate.Jnz,
        apUpdate: ApUpdate.Regular,
        fpUpdate: FpUpdate.Regular,
        opcode: Opcode.NoOp,
      };

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ap += [fp + 4] + [fp]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = -1n + BIAS;
      const offOp0 = (BIAS + 4n) << shift;
      const offOp1 = BIAS << (2n * shift);

      const flag = 0b0000010000101011n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const encodedInstructionUint64 =
        UnsignedInteger.toUint64(encodedInstruction).unwrap();
      const instruction = decodeInstruction(encodedInstructionUint64).unwrap();

      const expected: Instruction = {
        offDst: SignedInteger16.toInt16(-1),
        offOp0: SignedInteger16.toInt16(4),
        offOp1: SignedInteger16.toInt16(0),
        dstReg: RegisterFlag.FpRegisterFlag,
        op0Reg: RegisterFlag.FpRegisterFlag,
        op1Src: Op1Src.FP,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.Regular,
        apUpdate: ApUpdate.Add,
        fpUpdate: FpUpdate.Regular,
        opcode: Opcode.NoOp,
      };

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction call abs [fp + 4]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = BIAS;
      const offOp0 = (BIAS + 1n) << shift;
      const offOp1 = (BIAS + 4n) << (2n * shift);

      const flag = 0b0001000010001000n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const encodedInstructionUint64 =
        UnsignedInteger.toUint64(encodedInstruction).unwrap();
      const instruction = decodeInstruction(encodedInstructionUint64).unwrap();

      const expected: Instruction = {
        offDst: SignedInteger16.toInt16(0),
        offOp0: SignedInteger16.toInt16(1),
        offOp1: SignedInteger16.toInt16(4),
        dstReg: RegisterFlag.ApRegisterFlag,
        op0Reg: RegisterFlag.ApRegisterFlag,
        op1Src: Op1Src.FP,
        resLogic: ResLogic.Op1,
        pcUpdate: PcUpdate.Jump,
        apUpdate: ApUpdate.Add2,
        fpUpdate: FpUpdate.ApPlus2,
        opcode: Opcode.Call,
      };

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction RET from LC example', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L97
      const encodedInstructionUint64 =
        UnsignedInteger.toUint64(0x2948800080008000n).unwrap();
      const instruction = decodeInstruction(encodedInstructionUint64).unwrap();

      const expected: Instruction = {
        offDst: SignedInteger16.toInt16(0),
        offOp0: SignedInteger16.toInt16(0),
        offOp1: SignedInteger16.toInt16(0),
        dstReg: RegisterFlag.ApRegisterFlag,
        op0Reg: RegisterFlag.ApRegisterFlag,
        op1Src: Op1Src.FP,
        resLogic: ResLogic.Mul,
        pcUpdate: PcUpdate.JumpRel,
        apUpdate: ApUpdate.Add1,
        fpUpdate: FpUpdate.Dst,
        opcode: Opcode.Ret,
      };

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction CALL from LC example', () => {
      //https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L58
      const encodedInstructionUint64 =
        UnsignedInteger.toUint64(0x14a7800080008000n).unwrap();
      const instruction = decodeInstruction(encodedInstructionUint64).unwrap();

      const expected: Instruction = {
        offDst: SignedInteger16.toInt16(0),
        offOp0: SignedInteger16.toInt16(0),
        offOp1: SignedInteger16.toInt16(0),
        dstReg: RegisterFlag.FpRegisterFlag,
        op0Reg: RegisterFlag.FpRegisterFlag,
        op1Src: Op1Src.Imm,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.Jump,
        apUpdate: ApUpdate.Add,
        fpUpdate: FpUpdate.ApPlus2,
        opcode: Opcode.Call,
      };

      expect(instruction).toEqual(expected);
    });
  });
});
