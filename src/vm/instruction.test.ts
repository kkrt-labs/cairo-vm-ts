import { test, expect, describe } from 'bun:test';
import { Uint64, UnsignedInteger } from 'primitives/uint';
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
import { Int16, SignedInteger16 } from 'primitives/int';
import {
  HighBitSetError,
  InstructionError,
  InvalidApUpdate,
  InvalidOp1Src,
  InvalidOpcode,
  InvalidPcUpdate,
  InvalidResultLogic,
} from 'result/instruction';

describe('Instruction', () => {
  describe('decodeInstruction', () => {
    test('should throw an error HighBitSetError', () => {
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x94a7800080008000n);

      const { error } = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );
      expect(error).toEqual(new InstructionError(HighBitSetError));
    });

    test('should throw an error InvalidOp1Src', () => {
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x294f800080008000n);

      const { error } = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );
      expect(error).toEqual(new InstructionError(InvalidOp1Src));
    });

    test('should throw an error InvalidPcUpdate', () => {
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x29a8800080008000n);

      const { error } = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );
      expect(error).toEqual(new InstructionError(InvalidPcUpdate));
    });

    test('should throw an error InvalidResultLogic', () => {
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x2968800080008000n);

      const { error } = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );
      expect(error).toEqual(new InstructionError(InvalidResultLogic));
    });

    test('should throw an error InvalidOpcode', () => {
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x3948800080008000n);

      const { error } = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );
      expect(error).toEqual(new InstructionError(InvalidOpcode));
    });

    test('should throw an error with InvalidApUpdate', () => {
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x2d48800080008000n);

      const { error } = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );
      expect(error).toEqual(new InstructionError(InvalidApUpdate));
    });

    test('should correctly decode the cairo instruction [ap + 10] = [fp] + 42', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = 10n + BIAS;
      const offOp0 = BIAS << shift;
      const offOp1 = (1n + BIAS) << (2n * shift);

      const flag = 0b0100000000100110n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(encodedInstruction);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(10).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(1).value as Int16,
        RegisterFlag.AP,
        RegisterFlag.FP,
        Op1Src.Imm,
        ResLogic.Add,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.AssertEq
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction jmp rel [fp - 1] if [fp - 7] != 0', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = -7n + BIAS;
      const offOp0 = (BIAS - 1n) << shift;
      const offOp1 = (BIAS - 1n) << (2n * shift);

      const flag = 0b0000001000001011n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(encodedInstruction);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(-7).value as Int16,
        SignedInteger16.toInt16(-1).value as Int16,
        SignedInteger16.toInt16(-1).value as Int16,
        RegisterFlag.FP,
        RegisterFlag.FP,
        Op1Src.FP,
        ResLogic.Unconstrained,
        PcUpdate.Jnz,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ap += [fp + 4] + [fp]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = -1n + BIAS;
      const offOp0 = (BIAS + 4n) << shift;
      const offOp1 = BIAS << (2n * shift);

      const flag = 0b0000010000101011n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(encodedInstruction);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(-1).value as Int16,
        SignedInteger16.toInt16(4).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        RegisterFlag.FP,
        RegisterFlag.FP,
        Op1Src.FP,
        ResLogic.Add,
        PcUpdate.Regular,
        ApUpdate.Add,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction call abs [fp + 4]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const offDst = BIAS;
      const offOp0 = (BIAS + 1n) << shift;
      const offOp1 = (BIAS + 4n) << (2n * shift);

      const flag = 0b0001000010001000n << (3n * shift);
      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(encodedInstruction);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(1).value as Int16,
        SignedInteger16.toInt16(4).value as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.FP,
        ResLogic.Op1,
        PcUpdate.Jump,
        ApUpdate.Add2,
        FpUpdate.ApPlus2,
        Opcode.Call
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction CALL - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L58
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x14a7800080008000n);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        RegisterFlag.FP,
        RegisterFlag.FP,
        Op1Src.Imm,
        ResLogic.Add,
        PcUpdate.Jump,
        ApUpdate.Add,
        FpUpdate.ApPlus2,
        Opcode.Call
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction RET - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L97
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x2948800080008000n);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.FP,
        ResLogic.Mul,
        PcUpdate.JumpRel,
        ApUpdate.Add1,
        FpUpdate.Dst,
        Opcode.Ret
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ASSERT_EQ 1 - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L136
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x4a50800080008000n);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.AP,
        ResLogic.Mul,
        PcUpdate.Jnz,
        ApUpdate.Add1,
        FpUpdate.Regular,
        Opcode.AssertEq
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ASSERT_EQ 2 - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L175
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x4200800080008000n);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.Op0,
        ResLogic.Unconstrained,
        PcUpdate.Jnz,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.AssertEq
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the cairo instruction NoOp 1 - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L214
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x0000800080008000n);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.Op0,
        ResLogic.Op1,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      expect(instruction.value).toEqual(expected);
    });

    test('should correctly decode the negative offsets', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L253
      const { value: encodedInstructionUint64 } =
        UnsignedInteger.toUint64(0x0000800180007fffn);
      const instruction = Instruction.decodeInstruction(
        encodedInstructionUint64 as Uint64
      );

      const expected = new Instruction(
        SignedInteger16.toInt16(-1).value as Int16,
        SignedInteger16.toInt16(0).value as Int16,
        SignedInteger16.toInt16(1).value as Int16,
        RegisterFlag.AP,
        RegisterFlag.AP,
        Op1Src.Op0,
        ResLogic.Op1,
        PcUpdate.Regular,
        ApUpdate.Regular,
        FpUpdate.Regular,
        Opcode.NoOp
      );

      expect(instruction.value).toEqual(expected);
    });
  });
});
