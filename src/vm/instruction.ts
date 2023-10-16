// Instruction is the representation of the first word of each Cairo instruction.
// Some instructions spread over two words when they use an immediate value, so
// representing the first one with this struct is enougth.

import { Int16, SignedInteger16 } from 'primitives/int';
import { Uint64, UnsignedInteger } from 'primitives/uint';
import { Err, Ok, Result, VMError } from 'result-pattern/result';

export const HighBitSetError: VMError = {
  message: 'InstructionDecodingError: High bit is not zero',
};
export const InvalidOp1Src: VMError = {
  message: 'InstructionDecodingError: Invalid Operand 1 Source',
};
export const InvalidPcUpdate: VMError = {
  message: 'InstructionDecodingError: Invalid PC Update',
};
export const InvalidApUpdate: VMError = {
  message: 'InstructionDecodingError: Invalid AP Update',
};
export const InvalidResultLogic: VMError = {
  message: 'InstructionDecodingError: Invalid Result Logic',
};
export const InvalidOpcode: VMError = {
  message: 'InstructionDecodingError: Invalid Opcode',
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
  Imm = 0,
  ApPlusOffOp1 = 1,
  FpPlusOffOp1 = 2,
  Op0 = 4,
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
  const highBit = 1n << 63n;
  const dstRegMask = UnsignedInteger.toUint16(0x01).unwrap(); // safe to unwrap
  const dstRegOff = UnsignedInteger.toUint16(0).unwrap(); // safe to unwrap
  const op0RegMask = UnsignedInteger.toUint16(0x02).unwrap(); // safe to unwrap
  const op0RegOff = UnsignedInteger.toUint16(1).unwrap(); // safe to unwrap
  const op1SrcMask = UnsignedInteger.toUint16(0x1c).unwrap(); // safe to unwrap
  const op1SrcOff = UnsignedInteger.toUint16(2).unwrap(); // safe to unwrap
  const resLogicMask = UnsignedInteger.toUint16(0x60).unwrap(); // safe to unwrap
  const resLogicOff = UnsignedInteger.toUint16(5).unwrap(); // safe to unwrap
  const pcUpdateMask = UnsignedInteger.toUint16(0x0380).unwrap(); // safe to unwrap
  const pcUpdateOff = UnsignedInteger.toUint16(7).unwrap(); // safe to unwrap
  const apUpdateMask = UnsignedInteger.toUint16(0x0c00).unwrap(); // safe to unwrap
  const apUpdateOff = UnsignedInteger.toUint16(10).unwrap(); // safe to unwrap
  const opcodeMask = UnsignedInteger.toUint16(0x7000).unwrap(); // safe to unwrap
  const opcodeOff = UnsignedInteger.toUint16(12).unwrap(); // safe to unwrap

  if ((highBit & encodedInstruction) !== 0n) {
    return new Err(HighBitSetError);
  }

  const mask = UnsignedInteger.toUint64(0xffffn).unwrap(); // safe to unwrap
  const shift = UnsignedInteger.toUint64(16n).unwrap(); // safe to unwrap

  // Get the offset by masking and shifting the encoded instruction
  const offsetDstUint64 = UnsignedInteger.uint64And(encodedInstruction, mask);
  const offsetDstResult = SignedInteger16.fromBiased(offsetDstUint64);
  if (offsetDstResult.isErr()) {
    return offsetDstResult;
  }
  const offsetDst = offsetDstResult.unwrap();

  var shiftedEncodedInstruction = UnsignedInteger.uint64Rhs(
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

  var shiftedEncodedInstruction = UnsignedInteger.uint64Rhs(
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

  // Get the flags by masking and shifting the encoded instruction
  var shiftedEncodedInstruction = UnsignedInteger.uint64Rhs(
    shiftedEncodedInstruction,
    shift
  );
  const flagsUint64 = UnsignedInteger.uint64And(
    shiftedEncodedInstruction,
    mask
  );
  const flagsResult = UnsignedInteger.downCastToUint16(flagsUint64);
  if (flagsResult.isErr()) {
    return flagsResult;
  }

  const flags = flagsResult.unwrap();

  const dstReg = UnsignedInteger.uint16Rhs(
    UnsignedInteger.uint16And(flags, dstRegMask),
    dstRegOff
  );
  const op0Reg = UnsignedInteger.uint16Rhs(
    UnsignedInteger.uint16And(flags, op0RegMask),
    op0RegOff
  );

  const op1SrcNum = UnsignedInteger.uint16Rhs(
    UnsignedInteger.uint16And(flags, op1SrcMask),
    op1SrcOff
  );
  var op1Src: Op1Src;
  switch (op1SrcNum) {
    case 0:
      op1Src = Op1Src.Imm;
      break;
    case 1:
      op1Src = Op1Src.FpPlusOffOp1;
      break;
    case 2:
      op1Src = Op1Src.ApPlusOffOp1;
      break;
    case 4:
      op1Src = Op1Src.Op0;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  const pcUpdateNum = UnsignedInteger.uint16Rhs(
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

  const resLogicNum = UnsignedInteger.uint16Rhs(
    UnsignedInteger.uint16And(flags, resLogicMask),
    resLogicOff
  );
  var resLogic: ResLogic;
  switch (resLogicNum) {
    case 0:
      if (pcUpdate == PcUpdate.PcUpdateJump) {
        resLogic = ResLogic.Unconstrained;
      } else {
        resLogic = ResLogic.Op1;
      }
    case 1:
      resLogic = ResLogic.Add;
      break;
    case 2:
      resLogic = ResLogic.Mul;
      break;
    default:
      return new Err(InvalidOp1Src);
  }

  const opcodeNum = UnsignedInteger.uint16Rhs(
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

  const apUpdateNum = UnsignedInteger.uint16Rhs(
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
