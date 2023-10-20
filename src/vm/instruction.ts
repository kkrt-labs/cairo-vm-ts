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
  AP = 0,
  FP = 1,
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
  // The register to use as the Destination Operand
  dstReg: DstRegister;
  // The register to use as the Operand 0
  op0Reg: Op0Register;
  // The source of the Operand 1
  op1Src: Op1Src;
  // The result logic
  resLogic: ResLogic;
  // The logic to use to compute the next pc
  pcUpdate: PcUpdate;
  // The logic to use to compute the next ap
  apUpdate: ApUpdate;
  // The logic to use to compute the next fp
  fpUpdate: FpUpdate;
  // The opcode
  opcode: Opcode;
};

export function decodeInstruction(
  encodedInstruction: Uint64
): Result<Instruction, VMError> {
  // mask for the high bit of a 64-bit number
  const highBit = 1n << 63n;
  // dstReg is located at bits 0-0. We apply a mask of 0x01 (0b1)
  // and shift 0 bits right
  const dstRegMask = 0x01;
  const dstRegOff = 0;
  // op0Reg is located at bits 1-1. We apply a mask of 0x02 (0b10)
  // and shift 1 bit right
  const op0RegMask = 0x02;
  const op0RegOff = 1;
  // op1Src is located at bits 2-4. We apply a mask of 0x1c (0b11100)
  // and shift 2 bits right
  const op1SrcMask = 0x1c;
  const op1SrcOff = 2;
  // resLogic is located at bits 5-6. We apply a mask of 0x60 (0b1100000)
  // and shift 5 bits right
  const resLogicMask = 0x60;
  const resLogicOff = 5;
  // pcUpdate is located at bits 7-9. We apply a mask of 0x380 (0b1110000000)
  // and shift 7 bits right
  const pcUpdateMask = 0x0380;
  const pcUpdateOff = 7;
  // apUpdate is located at bits 10-11. We apply a mask of 0xc00 (0b110000000000)
  // and shift 10 bits right
  const apUpdateMask = 0x0c00;
  const apUpdateOff = 10;
  // opcode is located at bits 12-14. We apply a mask of 0x7000 (0b111000000000000)
  // and shift 12 bits right
  const opcodeMask = 0x7000;
  const opcodeOff = 12;

  if ((highBit & encodedInstruction) !== 0n) {
    return new Err(HighBitSetError);
  }

  // mask for the 16 least significant bits of a 64-bit number
  const mask = 0xffffn;
  const shift = 16n;

  // Get the offset by masking and shifting the encoded instruction
  const offsetDst = SignedInteger16.fromBiased(encodedInstruction & mask);
  if (offsetDst.isErr()) {
    return offsetDst;
  }

  let shiftedEncodedInstruction = encodedInstruction >> shift;
  const offsetOp0 = SignedInteger16.fromBiased(
    shiftedEncodedInstruction & mask
  );
  if (offsetOp0.isErr()) {
    return offsetOp0;
  }

  shiftedEncodedInstruction = shiftedEncodedInstruction >> shift;
  const offsetOp1 = SignedInteger16.fromBiased(
    shiftedEncodedInstruction & mask
  );
  if (offsetOp1.isErr()) {
    return offsetOp1;
  }

  // Get the flags by shifting the encoded instruction
  const flags = Number(shiftedEncodedInstruction >> shift);

  // Destination register is either Ap or Fp
  const dstReg = (flags & dstRegMask) >> dstRegOff;
  // Operand 0 register is either Ap or Fp
  const op0Reg = (flags & op0RegMask) >> op0RegOff;

  const op1SrcNum = (flags & op1SrcMask) >> op1SrcOff;
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

  const pcUpdateNum = (flags & pcUpdateMask) >> pcUpdateOff;
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

  const resLogicNum = (flags & resLogicMask) >> resLogicOff;
  let resLogic: ResLogic;
  switch (resLogicNum) {
    case 0:
      // if pc_update == jnz and res_logic == 0 then
      // res is unconstrained else res = op1
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

  const opcodeNum = (flags & opcodeMask) >> opcodeOff;
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

  const apUpdateNum = (flags & apUpdateMask) >> apUpdateOff;
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
    offDst: offsetDst.unwrap(),
    offOp0: offsetOp0.unwrap(),
    offOp1: offsetOp1.unwrap(),
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
