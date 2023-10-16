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
    test('should correctly decode a valid cairo instruction', () => {
      const shift = 16n;
      const offDst = 0b010101n;
      const offOp0 = 0b101010n << shift;
      const offOp1 = 0b111111n << (2n * shift);

      const flag = 0b0100010000100100n << (3n * shift);

      const encodedInstruction = offDst | offOp0 | offOp1 | flag;
      const encodedInstructionUint64 =
        UnsignedInteger.toUint64(encodedInstruction).unwrap();
      const instruction = decodeInstruction(encodedInstructionUint64).unwrap();

      const expected: Instruction = {
        offDst: SignedInteger16.toInt16(-32747),
        offOp0: SignedInteger16.toInt16(-32726),
        offOp1: SignedInteger16.toInt16(-32705),
        dstReg: RegisterFlag.ApRegisterFlag,
        op0Reg: RegisterFlag.ApRegisterFlag,
        op1Src: Op1Src.FpPlusOffOp1,
        resLogic: ResLogic.Add,
        pcUpdate: PcUpdate.PcUpdateRegular,
        apUpdate: ApUpdate.ApUpdateAdd,
        fpUpdate: FpUpdate.FpUpdateRegular,
        opcode: Opcode.AssertEq,
      };

      expect(instruction).toEqual(expected);
    });
  });
});
