// Instruction is the representation of the first word of each Cairo instruction.
// Some instructions spread over two words when they use an immediate value, so
// representing the first one with this struct is enougth.

import { Int16, SignedInteger16 } from 'primitives/int';
import { Uint64, UnsignedInteger } from 'primitives/uint';
import { Err, Ok, Result, VMError } from 'result-pattern/result';

const DECODING_ERRORS = {
  HIGH_BIT_SET: 'High bit is not zero',
  INVALID_OP1_SRC: 'Invalid Operand 1 Source',
  INVALID_PC_UPDATE: 'Invalid PC Update',
  INVALID_AP_UPDATE: 'Invalid AP Update',
  INVALID_RES_LOGIC: 'Invalid Result Logic',
  INVALID_OPCODE: 'Invalid Opcode',
} as const;

export const HighBitSetError: VMError = {
  message: `InstructionDecodingError: ${DECODING_ERRORS.HIGH_BIT_SET}`,
};
export const InvalidOp1Src: VMError = {
  message: `InstructionDecodingError: ${DECODING_ERRORS.INVALID_OP1_SRC}`,
};
export const InvalidPcUpdate: VMError = {
  message: `InstructionDecodingError: ${DECODING_ERRORS.INVALID_PC_UPDATE}`,
};
export const InvalidApUpdate: VMError = {
  message: `InstructionDecodingError: ${DECODING_ERRORS.INVALID_AP_UPDATE}`,
};
export const InvalidResultLogic: VMError = {
  message: `InstructionDecodingError: ${DECODING_ERRORS.INVALID_RES_LOGIC}`,
};
export const InvalidOpcode: VMError = {
  message: `InstructionDecodingError: ${DECODING_ERRORS.INVALID_OPCODE}`,
};

//  Structure of the 63-bit that form the first word of each instruction.
//  See Cairo whitepaper, page 32 - https://eprint.iacr.org/2021/1063.pdf.
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                     off_dst (biased representation)                     │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                     off_op0 (biased representation)                     │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                     off_op1 (biased representation)                     │
// ├─────┬─────┬───────────┬───────┬───────────┬─────────┬──────────────┬────┤
// │ dst │ op0 │    op1    │  res  │    pc     │   ap    │    opcode    │ 0  │
// │ reg │ reg │    src    │ logic │  update   │ update  │              │    │
// ├─────┼─────┼───┬───┬───┼───┬───┼───┬───┬───┼────┬────┼────┬────┬────┼────┤
// │  0  │  1  │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │
// └─────┴─────┴───┴───┴───┴───┴───┴───┴───┴───┴────┴────┴────┴────┴────┴────┘
// Source: https://github.com/lambdaclass/cairo-vm_in_go/blob/main/pkg/vm/instruction.go

// Dst & Op0 register flags
// If the flag == 0, then the offset will point to Ap
// If the flag == 1, then the offset will point to Fp
export enum RegisterFlag {
  ApRegisterFlag = 0,
  FpRegisterFlag = 1,
}
export type DstRegister = RegisterFlag;
export type Op0Register = RegisterFlag;

// Op1Src
export enum Op1Src {
  Op0 = 0,
  Imm = 1,
  FP = 2,
  AP = 4,
}

// ResLogic
export enum ResLogic {
  Op1 = 0,
  Add = 1,
  Mul = 2,
  Unconstrained = 3,
}

// Pc Update
export enum PcUpdate {
  Regular = 0,
  Jump = 1,
  JumpRel = 2,
  Jnz = 4,
}

// Ap update
export enum ApUpdate {
  Regular = 0,
  Add = 1,
  Add1 = 2,
  Add2 = 3,
}

// Fp Update
export enum FpUpdate {
  Regular = 0,
  ApPlus2 = 1,
  Dst = 2,
}

export enum Opcode {
  NoOp = 0,
  Call = 1,
  Ret = 2,
  AssertEq = 4,
}

export type Instruction = {
  // The offset to add or sub to ap/fp to obtain the Destination Operand
  offDst: Int16;
  offOp0: Int16;
  offOp1: Int16;
  dstReg: DstRegister;
  op0Reg: Op0Register;
  op1Src: Op1Src;
  resLogic: ResLogic;
  pcUpdate: PcUpdate;
  apUpdate: ApUpdate;
  fpUpdate: FpUpdate;
  opcode: Opcode;
};

export function decodeInstruction(
  encodedInstruction: Uint64
): Result<Instruction, VMError> {
  // mask for the high bit of a 64-bit number
  const highBit = 1n << 63n;
  // dstReg is located at bits 0-0. We apply a mask of 0x01 (0b1)
  // and shift 0 bits right
  const dstRegMask = UnsignedInteger.toUint16(0x01).unwrap();
  const dstRegOff = UnsignedInteger.toUint16(0).unwrap();
  // op0Reg is located at bits 1-1. We apply a mask of 0x02 (0b10)
  // and shift 1 bit right
  const op0RegMask = UnsignedInteger.toUint16(0x02).unwrap();
  const op0RegOff = UnsignedInteger.toUint16(1).unwrap();
  // op1Src is located at bits 2-4. We apply a mask of 0x1c (0b11100)
  // and shift 2 bits right
  const op1SrcMask = UnsignedInteger.toUint16(0x1c).unwrap();
  const op1SrcOff = UnsignedInteger.toUint16(2).unwrap();
  // resLogic is located at bits 5-6. We apply a mask of 0x60 (0b1100000)
  // and shift 5 bits right
  const resLogicMask = UnsignedInteger.toUint16(0x60).unwrap();
  const resLogicOff = UnsignedInteger.toUint16(5).unwrap();
  // pcUpdate is located at bits 7-9. We apply a mask of 0x380 (0b1110000000)
  // and shift 7 bits right
  const pcUpdateMask = UnsignedInteger.toUint16(0x0380).unwrap();
  const pcUpdateOff = UnsignedInteger.toUint16(7).unwrap();
  // apUpdate is located at bits 10-11. We apply a mask of 0xc00 (0b110000000000)
  // and shift 10 bits right
  const apUpdateMask = UnsignedInteger.toUint16(0x0c00).unwrap();
  const apUpdateOff = UnsignedInteger.toUint16(10).unwrap();
  // opcode is located at bits 12-14. We apply a mask of 0x7000 (0b111000000000000)
  // and shift 12 bits right
  const opcodeMask = UnsignedInteger.toUint16(0x7000).unwrap();
  const opcodeOff = UnsignedInteger.toUint16(12).unwrap();

  if ((highBit & encodedInstruction) !== 0n) {
    return new Err(HighBitSetError);
  }

  // mask for the 16 least significant bits of a 64-bit number
  const mask = UnsignedInteger.toUint64(0xffffn).unwrap();
  const shift = UnsignedInteger.toUint64(16n).unwrap();

  // Get the offset by masking and shifting the encoded instruction
  const offsetDstUint64 = UnsignedInteger.uint64And(encodedInstruction, mask);
  const offsetDstResult = SignedInteger16.fromBiased(offsetDstUint64);
  if (offsetDstResult.isErr()) {
    return offsetDstResult;
  }
  const offsetDst = offsetDstResult.unwrap();

  let shiftedEncodedInstruction = UnsignedInteger.uint64Shr(
    encodedInstruction,
    shift
  );
  const offsetOp0Uint64 = UnsignedInteger.uint64And(
    shiftedEncodedInstruction,
    mask
  );
  const offsetOp0Result = SignedInteger16.fromBiased(offsetOp0Uint64);
  if (offsetOp0Result.isErr()) {
    return offsetOp0Result;
  }
  const offsetOp0 = offsetOp0Result.unwrap();

  shiftedEncodedInstruction = UnsignedInteger.uint64Shr(
    shiftedEncodedInstruction,
    shift
  );
  const offsetOp1Uint64 = UnsignedInteger.uint64And(
    shiftedEncodedInstruction,
    mask
  );
  const offsetOp1Result = SignedInteger16.fromBiased(offsetOp1Uint64);
  if (offsetOp1Result.isErr()) {
    return offsetOp1Result;
  }
  const offsetOp1 = offsetOp1Result.unwrap();

  // Get the flags by shifting the encoded instruction
  shiftedEncodedInstruction = UnsignedInteger.uint64Shr(
    shiftedEncodedInstruction,
    shift
  );
  const flagsResult = UnsignedInteger.downCastToUint16(
    shiftedEncodedInstruction
  );
  if (flagsResult.isErr()) {
    return flagsResult;
  }

  const flags = flagsResult.unwrap();

  // Destination register is either Ap or Fp
  const dstReg = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, dstRegMask),
    dstRegOff
  );
  // Operand 0 register is either Ap or Fp
  const op0Reg = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, op0RegMask),
    op0RegOff
  );

  const op1SrcNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, op1SrcMask),
    op1SrcOff
  );
  let op1Src: Op1Src;
  switch (op1SrcNum) {
    case 0:
      // op1 = m(op0 + offop1)
      op1Src = Op1Src.Op0;
      break;
    case 1:
      // op1 = m(pc + offop1)
      op1Src = Op1Src.Imm;
      break;
    case 2:
      // op1 = m(fp + offop1)
      op1Src = Op1Src.FP;
      break;
    case 4:
      // op1 = m(ap + offop1)
      op1Src = Op1Src.AP;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  const pcUpdateNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, pcUpdateMask),
    pcUpdateOff
  );
  let pcUpdate: PcUpdate;
  switch (pcUpdateNum) {
    case 0:
      // pc = pc + instruction size
      pcUpdate = PcUpdate.Regular;
      break;
    case 1:
      // pc = res
      pcUpdate = PcUpdate.Jump;
      break;
    case 2:
      // pc = pc + res
      pcUpdate = PcUpdate.JumpRel;
      break;
    case 4:
      // if dst != 0 then pc = pc + instruction_size else pc + op1
      pcUpdate = PcUpdate.Jnz;
      break;
    default:
      return new Err(InvalidPcUpdate);
  }

  const resLogicNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, resLogicMask),
    resLogicOff
  );
  let resLogic: ResLogic;
  switch (resLogicNum) {
    case 0:
      // jnz with res_logic == 0 and pc_update == 3 then unconstrained
      // else res = op1
      if (pcUpdate == PcUpdate.Jnz) {
        resLogic = ResLogic.Unconstrained;
      } else {
        resLogic = ResLogic.Op1;
      }
      break;
    case 1:
      // res = op0 + op1
      resLogic = ResLogic.Add;
      break;
    case 2:
      // res = op0 * op1
      resLogic = ResLogic.Mul;
      break;
    default:
      return new Err(InvalidResultLogic);
  }

  const opcodeNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, opcodeMask),
    opcodeOff
  );
  let opcode: Opcode;
  switch (opcodeNum) {
    case 0:
      // fp = fp
      opcode = Opcode.NoOp;
      break;
    case 1:
      // fp = ap + 2
      opcode = Opcode.Call;
      break;
    case 2:
      // Return: fp = dst
      opcode = Opcode.Ret;
      break;
    case 4:
      // Assert equal: assert dst == op0, fp = fp
      opcode = Opcode.AssertEq;
      break;
    default:
      return new Err(InvalidOpcode);
  }

  const apUpdateNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, apUpdateMask),
    apUpdateOff
  );
  let apUpdate: ApUpdate;
  switch (apUpdateNum) {
    case 0:
      // call with ap_update = 0: ap = ap + 2
      // else ap = ap
      if (opcode == Opcode.Call) {
        apUpdate = ApUpdate.Add2;
      } else {
        apUpdate = ApUpdate.Regular;
      }
      break;
    case 1:
      // ap = ap + res
      apUpdate = ApUpdate.Add;
      break;
    case 2:
      // ap = ap + 1
      apUpdate = ApUpdate.Add1;
      break;
    default:
      return new Err(InvalidApUpdate);
  }

  let fpUpdate: FpUpdate;
  switch (opcode) {
    case Opcode.Call:
      // fp = ap + 2
      fpUpdate = FpUpdate.ApPlus2;
      break;
    case Opcode.Ret:
      // fp = dst
      fpUpdate = FpUpdate.Dst;
      break;
    default:
      // fp = fp
      fpUpdate = FpUpdate.Regular;
  }

  return new Ok({
    offDst: offsetDst,
    offOp0: offsetOp0,
    offOp1: offsetOp1,
    dstReg: dstReg,
    op0Reg: op0Reg,
    op1Src: op1Src,
    resLogic: resLogic,
    pcUpdate: pcUpdate,
    apUpdate: apUpdate,
    fpUpdate: fpUpdate,
    opcode: opcode,
  });
}
