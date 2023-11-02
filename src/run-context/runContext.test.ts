import { test, expect, describe } from 'bun:test';
import {
  Op0NotRelocatable,
  Op0Undefined,
  Op1ImmediateOffsetError,
  RunContext,
  RunContextError,
} from './runContext';
import { UnsignedInteger } from 'primitives/uint';
import {
  ApUpdate,
  FpUpdate,
  Instruction,
  Op1Src,
  Opcode,
  PcUpdate,
  RegisterFlag,
  ResLogic,
} from 'vm/instruction';
import { SignedInteger16 } from 'primitives/int';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';

describe('RunContext', () => {
  describe('incrementPc', () => {
    test('should successfully increment pc', () => {
      const ctx = RunContext.default();
      const instructionSize = UnsignedInteger.toUint32(2);
      const result = ctx.incrementPc(instructionSize);

      expect(result.getOffset()).toEqual(2);
      expect(result.getSegmentIndex()).toEqual(0);
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm/blob/main/vm/src/vm/context/run_context.rs#L116
  describe('computeDstAddress', () => {
    test('should compute dst addr for ap register', () => {
      const runContext = new RunContext(4, 5, 6);

      const dstAddr = runContext.computeAddress(
        RegisterFlag.AP,
        SignedInteger16.toInt16(1)
      );

      expect(dstAddr.getSegmentIndex()).toEqual(1);
      expect(dstAddr.getOffset()).toEqual(6);
    });

    test('should compute dst addr for fp register', () => {
      const runContext = new RunContext(4, 5, 6);

      const dstAddr = runContext.computeAddress(
        RegisterFlag.FP,
        SignedInteger16.toInt16(1)
      );

      expect(dstAddr.getSegmentIndex()).toEqual(1);
      expect(dstAddr.getOffset()).toEqual(7);
    });
  });

  // Test cases reproduced from:
  // https://github.com/lambdaclass/cairo-vm/blob/main/vm/src/vm/context/run_context.rs#L229
  describe('computeOp1Address', () => {
    test('should compute op1 addr for fp register', () => {
      const runContext = new RunContext(4, 5, 6);

      const op1Addr = runContext.computeOp1Address(
        Op1Src.FP,
        SignedInteger16.toInt16(1),
        undefined
      );

      expect(op1Addr.getSegmentIndex()).toEqual(1);
      expect(op1Addr.getOffset()).toEqual(7);
    });

    test('should compute op1 addr for ap register', () => {
      const runContext = new RunContext(4, 5, 6);

      const op1Addr = runContext.computeOp1Address(
        Op1Src.AP,
        SignedInteger16.toInt16(1),
        undefined
      );

      expect(op1Addr.getSegmentIndex()).toEqual(1);
      expect(op1Addr.getOffset()).toEqual(6);
    });

    test('should compute op1 addr for op1 src imm', () => {
      const runContext = new RunContext(4, 5, 6);

      const op1Addr = runContext.computeOp1Address(
        Op1Src.Imm,
        SignedInteger16.toInt16(1),
        undefined
      );

      expect(op1Addr.getSegmentIndex()).toEqual(0);
      expect(op1Addr.getOffset()).toEqual(5);
    });

    test('should throw an error Op1ImmediateOffsetError for op1 src imm with incorrect offset', () => {
      const runContext = new RunContext(4, 5, 6);

      expect(() =>
        runContext.computeOp1Address(
          Op1Src.Imm,
          SignedInteger16.toInt16(2),
          undefined
        )
      ).toThrow(Op1ImmediateOffsetError);
    });

    test('should compute op1 addr for op1 src op0 with op0 relocatable', () => {
      const runContext = new RunContext(4, 5, 6);

      const op1Addr = runContext.computeOp1Address(
        Op1Src.Op0,
        SignedInteger16.toInt16(1),
        new Relocatable(1, 7)
      );

      expect(op1Addr.getSegmentIndex()).toEqual(1);
      expect(op1Addr.getOffset()).toEqual(8);
    });

    test('should throw an error Op0NotRelocatable for op1 src op0 with op0 felt', () => {
      const runContext = new RunContext(4, 5, 6);

      expect(() =>
        runContext.computeOp1Address(
          Op1Src.Op0,
          SignedInteger16.toInt16(1),
          new Felt(7n)
        )
      ).toThrow(Op0NotRelocatable);
    });

    test('should throw an error Op0Undefined for op1 src op0 with op0 undefined', () => {
      const runContext = new RunContext(4, 5, 6);

      expect(() =>
        runContext.computeOp1Address(
          Op1Src.Op0,
          SignedInteger16.toInt16(1),
          undefined
        )
      ).toThrow(Op0Undefined);
    });
  });
});
