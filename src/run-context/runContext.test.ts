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
      const instructionSize = UnsignedInteger.toUint32(2).unwrap();
      const result = ctx.incrementPc(instructionSize).unwrap();

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
        dstReg: RegisterFlag.ApRegisterFlag,
        op0Reg: RegisterFlag.FpRegisterFlag,
        op1Src: Op1Src.ApPlusOffOp1,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.PcUpdateRegular,
        apUpdate: ApUpdate.ApUpdateRegular,
        fpUpdate: FpUpdate.FpUpdateRegular,
        opcode: Opcode.NoOp,
      };

      const runContext = new RunContext(4, 5, 6);

      const dstAddr = runContext.computeDstAddress(instruction);

      expect(dstAddr.unwrap().getSegmentIndex()).toEqual(1);
      expect(dstAddr.unwrap().getOffset()).toEqual(6);
    });

    test('should compute dst addr for ap register', () => {
      const instruction: Instruction = {
        offDst: SignedInteger16.toInt16(1),
        offOp0: SignedInteger16.toInt16(2),
        offOp1: SignedInteger16.toInt16(3),
        dstReg: RegisterFlag.FpRegisterFlag,
        op0Reg: RegisterFlag.FpRegisterFlag,
        op1Src: Op1Src.ApPlusOffOp1,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.PcUpdateRegular,
        apUpdate: ApUpdate.ApUpdateRegular,
        fpUpdate: FpUpdate.FpUpdateRegular,
        opcode: Opcode.NoOp,
      };

      const runContext = new RunContext(4, 5, 6);

      const dstAddr = runContext.computeDstAddress(instruction);

      expect(dstAddr.unwrap().getSegmentIndex()).toEqual(1);
      expect(dstAddr.unwrap().getOffset()).toEqual(7);
    });
  });
});
