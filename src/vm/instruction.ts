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
  Op1SrcOp0 = 0,
  Op1SrcImm = 1,
  Op1SrcFP = 2,
  Op1SrcAP = 4,
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
  PcUpdateRegular = 0,
  PcUpdateJump = 1,
  PcUpdateJumpRel = 2,
  PcUpdateJnz = 3,
}

// Ap update
export enum ApUpdate {
  ApUpdateRegular = 0,
  ApUpdateAdd = 1,
  ApUpdateAdd1 = 2,
  ApUpdateAdd2 = 3,
}

// Fp Update
export enum FpUpdate {
  FpUpdateRegular = 0,
  FpUpdateApPlus2 = 1,
  FpUpdateDst = 2,
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

  const dstReg = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, dstRegMask),
    dstRegOff
  );
  const op0Reg = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, op0RegMask),
    op0RegOff
  );

  const op1SrcNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, op1SrcMask),
    op1SrcOff
  );
  var op1Src: Op1Src;
  switch (op1SrcNum) {
    case 0:
      op1Src = Op1Src.Op1SrcOp0;
      break;
    case 1:
      op1Src = Op1Src.Op1SrcImm;
      break;
    case 2:
      op1Src = Op1Src.Op1SrcFP;
      break;
    case 4:
      op1Src = Op1Src.Op1SrcAP;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  const pcUpdateNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, pcUpdateMask),
    pcUpdateOff
  );
  var pcUpdate: PcUpdate;
  switch (pcUpdateNum) {
    case 0:
      pcUpdate = PcUpdate.PcUpdateRegular;
      break;
    case 1:
      pcUpdate = PcUpdate.PcUpdateJump;
      break;
    case 2:
      pcUpdate = PcUpdate.PcUpdateJumpRel;
      break;
    case 4:
      pcUpdate = PcUpdate.PcUpdateJnz;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  const resLogicNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, resLogicMask),
    resLogicOff
  );
  var resLogic: ResLogic;
  switch (resLogicNum) {
    case 0:
      if (pcUpdate == PcUpdate.PcUpdateJnz) {
        resLogic = ResLogic.Unconstrained;
      } else {
        resLogic = ResLogic.Op1;
      }
      break;
    case 1:
      resLogic = ResLogic.Add;
      break;
    case 2:
      resLogic = ResLogic.Mul;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  const opcodeNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, opcodeMask),
    opcodeOff
  );
  var opcode: Opcode;
  switch (opcodeNum) {
    case 0:
      opcode = Opcode.NoOp;
      break;
    case 1:
      opcode = Opcode.Call;
      break;
    case 2:
      opcode = Opcode.Ret;
      break;
    case 4:
      opcode = Opcode.AssertEq;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  const apUpdateNum = UnsignedInteger.uint16Shr(
    UnsignedInteger.uint16And(flags, apUpdateMask),
    apUpdateOff
  );
  var apUpdate: ApUpdate;
  switch (apUpdateNum) {
    case 0:
      if (opcode == Opcode.Call) {
        apUpdate = ApUpdate.ApUpdateAdd2;
      } else {
        apUpdate = ApUpdate.ApUpdateRegular;
      }
      break;
    case 1:
      apUpdate = ApUpdate.ApUpdateAdd;
      break;
    case 2:
      apUpdate = ApUpdate.ApUpdateAdd1;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  var fpUpdate: FpUpdate;
  switch (opcode) {
    case Opcode.Call:
      fpUpdate = FpUpdate.FpUpdateApPlus2;
      break;
    case Opcode.Ret:
      fpUpdate = FpUpdate.FpUpdateDst;
      break;
    default:
      fpUpdate = FpUpdate.FpUpdateRegular;
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
