import { test, expect, describe } from 'bun:test';
import { RunContext } from './runContext';
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
      const instruction: Instruction = {
        offDst: SignedInteger16.toInt16(1),
        offOp0: SignedInteger16.toInt16(2),
        offOp1: SignedInteger16.toInt16(3),
        dstReg: RegisterFlag.AP,
        op0Reg: RegisterFlag.FP,
        op1Src: Op1Src.AP,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.Regular,
        apUpdate: ApUpdate.Regular,
        fpUpdate: FpUpdate.Regular,
        opcode: Opcode.NoOp,
      };

      const runContext = new RunContext(4, 5, 6);

      const dstAddr = runContext.computeDstAddress(instruction);

      expect(dstAddr.getSegmentIndex()).toEqual(1);
      expect(dstAddr.getOffset()).toEqual(6);
    });

    test('should compute dst addr for ap register', () => {
      const instruction: Instruction = {
        offDst: SignedInteger16.toInt16(1),
        offOp0: SignedInteger16.toInt16(2),
        offOp1: SignedInteger16.toInt16(3),
        dstReg: RegisterFlag.FP,
        op0Reg: RegisterFlag.FP,
        op1Src: Op1Src.AP,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.Regular,
        apUpdate: ApUpdate.Regular,
        fpUpdate: FpUpdate.Regular,
        opcode: Opcode.NoOp,
      };

      const runContext = new RunContext(4, 5, 6);

      const dstAddr = runContext.computeDstAddress(instruction);

      expect(dstAddr.getSegmentIndex()).toEqual(1);
      expect(dstAddr.getOffset()).toEqual(7);
    });
  });
});
