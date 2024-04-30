import { test, expect, describe } from 'bun:test';

import { Instruction, Op1Source, Register, ResLogic } from './instruction';

import {
  HighBitSetError,
  InvalidApUpdate,
  InvalidOp1Source,
  InvalidOpcode,
  InvalidPcUpdate,
  InvalidResLogic,
} from 'errors/instruction';

describe('Instruction', () => {
  describe('decodeInstruction', () => {
    test('should throw an error HighBitSetError', () => {
      expect(() => Instruction.decodeInstruction(0x94a7800080008000n)).toThrow(
        new HighBitSetError()
      );
    });

    test('should throw an error InvalidOp1Source', () => {
      expect(() => Instruction.decodeInstruction(0x294f800080008000n)).toThrow(
        new InvalidOp1Source()
      );
    });

    test('should throw an error InvalidPcUpdate', () => {
      expect(() => Instruction.decodeInstruction(0x29a8800080008000n)).toThrow(
        new InvalidPcUpdate()
      );
    });

    test('should throw an error InvalidResLogic', () => {
      expect(() => Instruction.decodeInstruction(0x2968800080008000n)).toThrow(
        new InvalidResLogic()
      );
    });

    test('should throw an error InvalidOpcode', () => {
      expect(() => Instruction.decodeInstruction(0x3948800080008000n)).toThrow(
        new InvalidOpcode()
      );
    });

    test('should throw an error with InvalidApUpdate', () => {
      expect(() => Instruction.decodeInstruction(0x2d48800080008000n)).toThrow(
        new InvalidApUpdate()
      );
    });

    test('should correctly decode the cairo instruction [ap + 10] = [fp] + 42', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = 10n + BIAS;
      const op0Offset = BIAS << shift;
      const op1Offset = (1n + BIAS) << (2n * shift);

      const flag = 0b0100000000100110n << (3n * shift);
      const encodedInstruction = dstOffset | op0Offset | op1Offset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        10,
        0,
        1,
        Register.Ap,
        Register.Fp,
        Op1Source.Pc,
        ResLogic.Add,
        'pc = pc',
        'ap = ap',
        'fp = fp',
        'assert_eq'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction jmp rel [fp - 1] if [fp - 7] != 0', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = -7n + BIAS;
      const op0Offset = (BIAS - 1n) << shift;
      const op1Offset = (BIAS - 1n) << (2n * shift);

      const flag = 0b0000001000001011n << (3n * shift);
      const encodedInstruction = dstOffset | op0Offset | op1Offset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        -7,
        -1,
        -1,
        Register.Fp,
        Register.Fp,
        Op1Source.Fp,
        ResLogic.Unconstrained,
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction ap += [fp + 4] + [fp]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = -1n + BIAS;
      const op0Offset = (BIAS + 4n) << shift;
      const op1Offset = BIAS << (2n * shift);

      const flag = 0b0000010000101011n << (3n * shift);
      const encodedInstruction = dstOffset | op0Offset | op1Offset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        -1,
        4,
        0,
        Register.Fp,
        Register.Fp,
        Op1Source.Fp,
        ResLogic.Add,
        'pc = pc',
        'ap = ap + res',
        'fp = fp',
        'no-op'
      );

      expect(instruction).toEqual(expected);
    });

    test('should correctly decode the cairo instruction call abs [fp + 4]', () => {
      const BIAS = 2n ** 15n;
      const shift = 16n;
      const dstOffset = BIAS;
      const op0Offset = (BIAS + 1n) << shift;
      const op1Offset = (BIAS + 4n) << (2n * shift);

      const flag = 0b0001000010001000n << (3n * shift);
      const encodedInstruction = dstOffset | op0Offset | op1Offset | flag;

      const instruction = Instruction.decodeInstruction(encodedInstruction);

      const expected = new Instruction(
        0,
        1,
        4,
        Register.Ap,
        Register.Ap,
        Op1Source.Fp,
        ResLogic.Op1,
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
        Register.Fp,
        Register.Fp,
        Op1Source.Pc,
        ResLogic.Add,
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
        Register.Ap,
        Register.Ap,
        Op1Source.Fp,
        ResLogic.Mul,
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
        Register.Ap,
        Register.Ap,
        Op1Source.Ap,
        ResLogic.Mul,
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap++',
        'fp = fp',
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
        Register.Ap,
        Register.Ap,
        Op1Source.Op0,
        ResLogic.Unconstrained,
        'res != 0 ? pc = op1 : pc += instruction_size',
        'ap = ap',
        'fp = fp',
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
        Register.Ap,
        Register.Ap,
        Op1Source.Op0,
        ResLogic.Op1,
        'pc = pc',
        'ap = ap',
        'fp = fp',
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
        Register.Ap,
        Register.Ap,
        Op1Source.Op0,
        ResLogic.Op1,
        'pc = pc',
        'ap = ap',
        'fp = fp',
        'no-op'
      );

      expect(instruction).toEqual(expected);
    });
  });
});
