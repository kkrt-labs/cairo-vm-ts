import { test, expect, describe } from 'bun:test';
import { RunContext } from './runContext';
import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Op1Src, RegisterFlag } from 'vm/instruction';
import { Int16, SignedInteger16 } from 'primitives/int';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { BaseError, ErrorType } from 'result/error';
import {
  Op0NotRelocatable,
  Op0Undefined,
  Op1ImmediateOffsetError,
} from 'result/runContext';

describe('RunContext', () => {
  describe('incrementPc', () => {
    test('should successfully increment pc', () => {
      const ctx = RunContext.default();
      const { value: instructionSize } = UnsignedInteger.toUint32(2);
      const { value: result } = ctx.incrementPc(instructionSize as Uint32);

      expect((result as Relocatable).getOffset()).toEqual(2);
      expect((result as Relocatable).getSegmentIndex()).toEqual(0);
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm/blob/main/vm/src/vm/context/run_context.rs#L116
  describe('computeDstAddress', () => {
    test('should compute dst addr for ap register', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: dstAddr } = runContext.computeAddress(
        RegisterFlag.AP,
        offset as Int16
      );

      expect((dstAddr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((dstAddr as Relocatable).getOffset()).toEqual(6);
    });

    test('should compute dst addr for fp register', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: dstAddr } = runContext.computeAddress(
        RegisterFlag.FP,
        offset as Int16
      );

      expect((dstAddr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((dstAddr as Relocatable).getOffset()).toEqual(7);
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm/blob/main/vm/src/vm/context/run_context.rs#L229
  describe('computeOp1Address', () => {
    test('should compute op1 addr for fp register', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.FP,
        offset as Int16,
        undefined
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((op1Addr as Relocatable).getOffset()).toEqual(7);
    });

    test('should compute op1 addr for ap register', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.AP,
        offset as Int16,
        undefined
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((op1Addr as Relocatable).getOffset()).toEqual(6);
    });

    test('should compute op1 addr for op1 src imm', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.Imm,
        offset as Int16,
        undefined
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(0);
      expect((op1Addr as Relocatable).getOffset()).toEqual(5);
    });

    test('should return an error Op1ImmediateOffsetError for op1 src imm with incorrect offset', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(2);

      const { error } = runContext.computeOp1Address(
        Op1Src.Imm,
        offset as Int16,
        undefined
      );
      expect(error).toEqual(
        new BaseError(ErrorType.RunContextError, Op1ImmediateOffsetError)
      );
    });

    test('should compute op1 addr for op1 src op0 with op0 relocatable', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.Op0,
        offset as Int16,
        new Relocatable(1, 7)
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((op1Addr as Relocatable).getOffset()).toEqual(8);
    });

    test('should return an error Op0NotRelocatable for op1 src op0 with op0 felt', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { error } = runContext.computeOp1Address(
        Op1Src.Op0,
        offset as Int16,
        new Felt(7n)
      );
      expect(error).toEqual(
        new BaseError(ErrorType.RunContextError, Op0NotRelocatable)
      );
    });

    test('should return an error Op0Undefined for op1 src op0 with op0 undefined', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { error } = runContext.computeOp1Address(
        Op1Src.Op0,
        offset as Int16,
        undefined
      );
      expect(error).toEqual(
        new BaseError(ErrorType.RunContextError, Op0Undefined)
      );
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm/blob/main/vm/src/vm/context/run_context.rs#L229
  describe('computeOp1Address', () => {
    test('should compute op1 addr for fp register', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.FP,
        offset as Int16,
        undefined
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((op1Addr as Relocatable).getOffset()).toEqual(7);
    });

    test('should compute op1 addr for ap register', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.AP,
        offset as Int16,
        undefined
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((op1Addr as Relocatable).getOffset()).toEqual(6);
    });

    test('should compute op1 addr for op1 src imm', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.Imm,
        offset as Int16,
        undefined
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(0);
      expect((op1Addr as Relocatable).getOffset()).toEqual(5);
    });

    test('should return an error Op1ImmediateOffsetError for op1 src imm with incorrect offset', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(2);

      const { error } = runContext.computeOp1Address(
        Op1Src.Imm,
        offset as Int16,
        undefined
      );
      expect(error).toEqual(
        new BaseError(ErrorType.RunContextError, Op1ImmediateOffsetError)
      );
    });

    test('should compute op1 addr for op1 src op0 with op0 relocatable', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { value: op1Addr } = runContext.computeOp1Address(
        Op1Src.Op0,
        offset as Int16,
        new Relocatable(1, 7)
      );

      expect((op1Addr as Relocatable).getSegmentIndex()).toEqual(1);
      expect((op1Addr as Relocatable).getOffset()).toEqual(8);
    });

    test('should return an error Op0NotRelocatable for op1 src op0 with op0 felt', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { error } = runContext.computeOp1Address(
        Op1Src.Op0,
        offset as Int16,
        new Felt(7n)
      );
      expect(error).toEqual(
        new BaseError(ErrorType.RunContextError, Op0NotRelocatable)
      );
    });

    test('should return an error Op0Undefined for op1 src op0 with op0 undefined', () => {
      const runContext = new RunContext(4, 5, 6);
      const { value: offset } = SignedInteger16.toInt16(1);

      const { error } = runContext.computeOp1Address(
        Op1Src.Op0,
        offset as Int16,
        undefined
      );
      expect(error).toEqual(
        new BaseError(ErrorType.RunContextError, Op0Undefined)
      );
    });
  });
});
