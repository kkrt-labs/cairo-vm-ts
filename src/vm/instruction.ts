// Instruction is the representation of the first word of each Cairo instruction.
// Some instructions spread over two words when they use an immediate value, so
// representing the first one with this struct is enougth.

import {
  InstructionError,
  HighBitSetError,
  InvalidApUpdate,
  InvalidOp1Src,
  InvalidOpcode,
  InvalidPcUpdate,
  InvalidResultLogic,
} from 'errors/instruction';
import { SignedInteger16 } from 'primitives/int';
import { UnsignedInteger } from 'primitives/uint';

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
export type RegisterFlag = 'ap' | 'fp';

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

export class Instruction {
  // The offset to add or sub to ap/fp to obtain the Destination Operand
  public offDst: number;
  public offOp0: number;
  public offOp1: number;
  // The register to use as the Destination Operand
  public dstReg: RegisterFlag;
  // The register to use as the Operand 0
  public op0Reg: RegisterFlag;
  // The source of the Operand 1
  public op1Src: Op1Src;
  // The result logic
  public resLogic: ResLogic;
  // The logic to use to compute the next pc
  public pcUpdate: PcUpdate;
  // The logic to use to compute the next ap
  public apUpdate: ApUpdate;
  // The logic to use to compute the next fp
  public fpUpdate: FpUpdate;
  // The opcode
  public opcode: Opcode;

  static default(): Instruction {
    return new Instruction(
      0,
      0,
      0,
      'ap',
      'ap',
      Op1Src.Op0,
      ResLogic.Op1,
      PcUpdate.Regular,
      ApUpdate.Regular,
      FpUpdate.Regular,
      Opcode.NoOp
    );
  }

  constructor(
    offsetDst: number,
    offsetOp0: number,
    offsetOp1: number,
    desReg: RegisterFlag,
    op0Reg: RegisterFlag,
    op1Src: Op1Src,
    resLogic: ResLogic,
    pcUpdate: PcUpdate,
    apUpdate: ApUpdate,
    fpUpdate: FpUpdate,
    opcode: Opcode
  ) {
    // Check that the offsets are 16-bit signed integers
    SignedInteger16.ensureInt16(offsetDst);
    SignedInteger16.ensureInt16(offsetOp0);
    SignedInteger16.ensureInt16(offsetOp1);

    this.offDst = offsetDst;
    this.offOp0 = offsetOp0;
    this.offOp1 = offsetOp1;
    this.dstReg = desReg;
    this.op0Reg = op0Reg;
    this.op1Src = op1Src;
    this.resLogic = resLogic;
    this.pcUpdate = pcUpdate;
    this.apUpdate = apUpdate;
    this.fpUpdate = fpUpdate;
    this.opcode = opcode;
  }

  static decodeInstruction(encodedInstruction: bigint): Instruction {
    // Check that the encoded instruction fits in a 64-bit unsigned integer
    UnsignedInteger.ensureUint64(encodedInstruction);

    // Structure of the 48 first bits of an encoded instruction:
    // The 3 offsets (Dst, Op0, Op1) are 16-bit signed integers
    // See Cairo whitepaper, page 32 - https://eprint.iacr.org/2021/1063.pdf.
    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │                     off_dst (biased representation)                     │
    // ├─────────────────────────────────────────────────────────────────────────┤
    // │                     off_op0 (biased representation)                     │
    // ├─────────────────────────────────────────────────────────────────────────┤
    // │                     off_op1 (biased representation)                     │
    // ├─────┼─────┼───┬───┬───┼───┬───┼───┬───┬───┼────┬────┼────┬────┬────┼────┤
    // │  0  │  1  │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │
    // └─────┴─────┴───┴───┴───┴───┴───┴───┴───┴───┴────┴────┴────┴────┴────┴────┘

    // mask for the 16 least significant bits of the instruction
    const mask = 0xffffn;
    const shift = 16n;

    // Get the offset by masking and shifting the encoded instruction
    const offsetDst = SignedInteger16.fromBiased(encodedInstruction & mask);

    let shiftedEncodedInstruction = encodedInstruction >> shift;
    const offsetOp0 = SignedInteger16.fromBiased(
      shiftedEncodedInstruction & mask
    );

    shiftedEncodedInstruction = shiftedEncodedInstruction >> shift;
    const offsetOp1 = SignedInteger16.fromBiased(
      shiftedEncodedInstruction & mask
    );

    // Get the flags by shifting the encoded instruction
    const flags = shiftedEncodedInstruction >> shift;

    // INVARIANT: The high bit of the encoded instruction must be 0
    const highBit = 1n << 63n;
    if ((highBit & encodedInstruction) !== 0n) {
      throw new InstructionError(HighBitSetError);
    }

    // Decoding the flags and the logic of the instruction in the last 16 bits of the instruction
    // Note: the first 48 bits are reserved for the offsets of Dst, Op0 and Op1
    // Structure of the 16 last bits of each instruction
    // ├─────┬─────┬───────────┬───────┬───────────┬─────────┬──────────────┬────┤
    // │ dst │ op0 │    op1    │  res  │    pc     │   ap    │    opcode    │ 0  │
    // │ reg │ reg │    src    │ logic │  update   │ update  │              │    │
    // ├─────┼─────┼───┬───┬───┼───┬───┼───┬───┬───┼────┬────┼────┬────┬────┼────┤
    // │  0  │  1  │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │
    // └─────┴─────┴───┴───┴───┴───┴───┴───┴───┴───┴────┴────┴────┴────┴────┴────┘
    // dstReg is located at bits 0-0. We apply a mask of 0x01 (0b1)
    // and shift 0 bits right
    const dstRegMask = 0x01n;
    const dstRegOff = 0n;
    // op0Reg is located at bits 1-1. We apply a mask of 0x02 (0b10)
    // and shift 1 bit right
    const op0RegMask = 0x02n;
    const op0RegOff = 1n;
    // op1Src is located at bits 2-4. We apply a mask of 0x1c (0b11100)
    // and shift 2 bits right
    const op1SrcMask = 0x1cn;
    const op1SrcOff = 2n;
    // resLogic is located at bits 5-6. We apply a mask of 0x60 (0b1100000)
    // and shift 5 bits right
    const resLogicMask = 0x60n;
    const resLogicOff = 5n;
    // pcUpdate is located at bits 7-9. We apply a mask of 0x380 (0b1110000000)
    // and shift 7 bits right
    const pcUpdateMask = 0x0380n;
    const pcUpdateOff = 7n;
    // apUpdate is located at bits 10-11. We apply a mask of 0xc00 (0b110000000000)
    // and shift 10 bits right
    const apUpdateMask = 0x0c00n;
    const apUpdateOff = 10n;
    // opcode is located at bits 12-14. We apply a mask of 0x7000 (0b111000000000000)
    // and shift 12 bits right
    const opcodeMask = 0x7000n;
    const opcodeOff = 12n;

    // Destination register is either Ap or Fp
    const targetDstReg = (flags & dstRegMask) >> dstRegOff;
    let dstReg: RegisterFlag;
    if (targetDstReg == 0n) {
      dstReg = 'ap';
    } else {
      dstReg = 'fp';
    }
    // Operand 0 register is either Ap or Fp
    const targetRegisterFlag = (flags & op0RegMask) >> op0RegOff;
    let op0Reg: RegisterFlag;
    if (targetRegisterFlag == 0n) {
      op0Reg = 'ap';
    } else {
      op0Reg = 'fp';
    }

    const targetOp1Src = (flags & op1SrcMask) >> op1SrcOff;
    let op1Src: Op1Src;
    switch (targetOp1Src) {
      case 0n:
        // op1 = m(op0 + offop1)
        op1Src = Op1Src.Op0;
        break;
      case 1n:
        // op1 = m(pc + offop1)
        op1Src = Op1Src.Imm;
        break;
      case 2n:
        // op1 = m(fp + offop1)
        op1Src = Op1Src.FP;
        break;
      case 4n:
        // op1 = m(ap + offop1)
        op1Src = Op1Src.AP;
        break;
      default:
        throw new InstructionError(InvalidOp1Src);
    }

    const targetPcUpdate = (flags & pcUpdateMask) >> pcUpdateOff;
    let pcUpdate: PcUpdate;
    switch (targetPcUpdate) {
      case 0n:
        // pc = pc + instruction size
        pcUpdate = PcUpdate.Regular;
        break;
      case 1n:
        // pc = res
        pcUpdate = PcUpdate.Jump;
        break;
      case 2n:
        // pc = pc + res
        pcUpdate = PcUpdate.JumpRel;
        break;
      case 4n:
        // if dst != 0 then pc = pc + instruction_size else pc + op1
        pcUpdate = PcUpdate.Jnz;
        break;
      default:
        throw new InstructionError(InvalidPcUpdate);
    }

    const targetResLogic = (flags & resLogicMask) >> resLogicOff;
    let resLogic: ResLogic;
    switch (targetResLogic) {
      case 0n:
        // if pc_update == jnz and res_logic == 0 then
        // res is unconstrained else res = op1
        if (pcUpdate == PcUpdate.Jnz) {
          resLogic = ResLogic.Unconstrained;
        } else {
          resLogic = ResLogic.Op1;
        }
        break;
      case 1n:
        // res = op0 + op1
        resLogic = ResLogic.Add;
        break;
      case 2n:
        // res = op0 * op1
        resLogic = ResLogic.Mul;
        break;
      default:
        throw new InstructionError(InvalidResultLogic);
    }

    const targetOpcode = (flags & opcodeMask) >> opcodeOff;
    let opcode: Opcode;
    switch (targetOpcode) {
      case 0n:
        // fp = fp
        opcode = Opcode.NoOp;
        break;
      case 1n:
        // fp = ap + 2
        opcode = Opcode.Call;
        break;
      case 2n:
        // Return: fp = dst
        opcode = Opcode.Ret;
        break;
      case 4n:
        // Assert equal: assert dst == op0, fp = fp
        opcode = Opcode.AssertEq;
        break;
      default:
        throw new InstructionError(InvalidOpcode);
    }

    const targetApUpdate = (flags & apUpdateMask) >> apUpdateOff;
    let apUpdate: ApUpdate;
    switch (targetApUpdate) {
      case 0n:
        // call with ap_update = 0: ap = ap + 2
        // else ap = ap
        if (opcode == Opcode.Call) {
          apUpdate = ApUpdate.Add2;
        } else {
          apUpdate = ApUpdate.Regular;
        }
        break;
      case 1n:
        // ap = ap + res
        apUpdate = ApUpdate.Add;
        break;
      case 2n:
        // ap = ap + 1
        apUpdate = ApUpdate.Add1;
        break;
      default:
        throw new InstructionError(InvalidApUpdate);
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

    return new Instruction(
      offsetDst,
      offsetOp0,
      offsetOp1,
      dstReg,
      op0Reg,
      op1Src,
      resLogic,
      pcUpdate,
      apUpdate,
      fpUpdate,
      opcode
    );
  }

  size(): number {
    // The instruction's size is 2, i.e. PC will be incremented by 2 after the instruction is executed
    // Because immediate values are located at PC + 1. They are hardcoded constants located in the bytecode,
    // "immediately" after the instruction.
    if (this.op1Src == Op1Src.Imm) {
      return 2;
    }
    return 1;
  }
}
