import { test, expect, describe } from 'bun:test';

import {
  ApUpdate,
  FpUpdate,
  Instruction,
  OperandOneSource,
  Opcode,
  PcUpdate,
  ResultLogic,
} from './instruction';

import {
  HighBitSetError,
  InstructionError,
  InvalidApUpdate,
  InvalidOperandOneSource,
  InvalidOpcode,
  InvalidPcUpdate,
  InvalidResultLogic,
} from 'errors/instruction';

describe('Instruction', () => {
  describe('decodeInstruction', () => {
    test('should throw an error HighBitSetError', () => {
      expect(() => Instruction.decodeInstruction(0x94a7800080008000n)).toThrow(
        new InstructionError(HighBitSetError)
      );
    });

    test('should throw an error InvalidOperandOneSource', () => {
      expect(() => Instruction.decodeInstruction(0x294f800080008000n)).toThrow(
        new InstructionError(InvalidOperandOneSource)
      );
    });

    test('should throw an error InvalidPcUpdate', () => {
      expect(() => Instruction.decodeInstruction(0x29a8800080008000n)).toThrow(
        new InstructionError(InvalidPcUpdate)
      );
    });

    test('should throw an error InvalidResultLogic', () => {
      expect(() => Instruction.decodeInstruction(0x2968800080008000n)).toThrow(
        new InstructionError(InvalidResultLogic)
      );
    });

    test('should throw an error InvalidOpcode', () => {
      expect(() => Instruction.decodeInstruction(0x3948800080008000n)).toThrow(
        new InstructionError(InvalidOpcode)
      );
    });

    test('should throw an error with InvalidApUpdate', () => {
      expect(() => Instruction.decodeInstruction(0x2d48800080008000n)).toThrow(
        new InstructionError(InvalidApUpdate)
      );
    });

    test('should correctly decode the cairo instruction [ap + 10] = [fp] + 42', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = 10n + BIAS;
      const operandZeroOffset = BIAS << shift;
      const operandOneOffset = (1n + BIAS) << (2n * shift);

      const flag = 0b0100000000100110n << (3n * shift);
      const encodedInstruction =
        dstOffset | operandZeroOffset | operandOneOffset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        10,
        0,
        1,
        'ap',
        'fp',
        'pc',
        'op0 + op1',
        'no-op',
        'no-op',
        'no-op',
        'assert_eq'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction jmp rel [fp - 1] if [fp - 7] != 0', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = -7n + BIAS;
      const operandZeroOffset = (BIAS - 1n) << shift;
      const operandOneOffset = (BIAS - 1n) << (2n * shift);

      const flag = 0b0000001000001011n << (3n * shift);
      const encodedInstruction =
        dstOffset | operandZeroOffset | operandOneOffset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        -7,
        -1,
        -1,
        'fp',
        'fp',
        'fp',
        'unconstrained',
        'res != 0 ? pc = op1 : pc += instruction_size',
        'no-op',
        'no-op',
        'no-op'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ap += [fp + 4] + [fp]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = -1n + BIAS;
      const operandZeroOffset = (BIAS + 4n) << shift;
      const operandOneOffset = BIAS << (2n * shift);

      const flag = 0b0000010000101011n << (3n * shift);
      const encodedInstruction =
        dstOffset | operandZeroOffset | operandOneOffset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        -1,
        4,
        0,
        'fp',
        'fp',
        'fp',
        'op0 + op1',
        'no-op',
        'ap = ap + res',
        'no-op',
        'no-op'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction call abs [fp + 4]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = BIAS;
      const operandZeroOffset = (BIAS + 1n) << shift;
      const operandOneOffset = (BIAS + 4n) << (2n * shift);

      const flag = 0b0001000010001000n << (3n * shift);
      const encodedInstruction =
        dstOffset | operandZeroOffset | operandOneOffset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        0,
        1,
        4,
        'ap',
        'ap',
        'fp',
        'op1',
        'pc = res',
        'ap += 2',
        'fp = ap + 2',
        'call'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction CALL - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L58

      const instruction = Instruction.decodeInstruction(0x14a7800080008000n);

      const expected = new Instruction(
        0,
        0,
        0,
        'fp',
        'fp',
        'pc',
        'op0 + op1',
        'pc = res',
        'ap = ap + res',
        'fp = ap + 2',
        'call'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction RET - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L97

      const instruction = Instruction.decodeInstruction(0x2948800080008000n);

      const expected = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'fp',
        'op0 * op1',
        'pc = pc + res',
        'ap++',
        'fp = relocatable(dst) || fp += felt(dst)',
        'return'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ASSERT_EQ 1 - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L136

      const instruction = Instruction.decodeInstruction(0x4a50800080008000n);

      const expected = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'ap',
        'op0 * op1',
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap++',
        'no-op',
        'assert_eq'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ASSERT_EQ 2 - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L175

      const instruction = Instruction.decodeInstruction(0x4200800080008000n);

      const expected = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'op0',
        'unconstrained',
        'res != 0 ? pc = op1 : pc += instruction_size',
        'no-op',
        'no-op',
        'assert_eq'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction NoOp 1 - ported from lambdaclass/cairo-vm_in_go', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L214

      const instruction = Instruction.decodeInstruction(0x0000800080008000n);

      const expected = new Instruction(
        0,
        0,
        0,
        'ap',
        'ap',
        'op0',
        'op1',
        'no-op',
        'no-op',
        'no-op',
        'no-op'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the negative offsets', () => {
      // https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction_test.go#L253

      const instruction = Instruction.decodeInstruction(0x0000800180007fffn);

      const expected = new Instruction(
        -1,
        0,
        1,
        'ap',
        'ap',
        'op0',
        'op1',
        'no-op',
        'no-op',
        'no-op',
        'no-op'
      );

      expect(instruction).toEqual(expected);
    });
  });
});
