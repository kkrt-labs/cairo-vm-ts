// Instruction is the representation of the first word of each Cairo instruction.
// Some instructions spread over two words when they use an immediate value, so
// representing the first one with this struct is enough.

import {
  HighBitSetError,
  InvalidApUpdate,
  InvalidOp1Source,
  InvalidOpcode,
  InvalidPcUpdate,
  InvalidResLogic,
} from 'errors/instruction';

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

/** Flags to compute `dst` and `op0` from a register */
export enum Register {
  /**
   * - dst = [ap + dstOffset]
   * - op0 = [ap + op0Offset]
   */
  Ap,
  /**
   * - dst = [fp + dstOffset]
   * - op0 = [fp + op0Offset]
   */
  Fp,
}

/**
 * Source from which op1 is computed
 *
 * op1 = [op1Source + op1Offset]
 */
export enum Op1Source {
  /** op1 = [op0 + op1Offset] */
  Op0,
  /** op1 = [pc + op1Offset] */
  Pc,
  /** op1 = [fp + op1Offset] */
  Fp,
  /** op1 = [ap + op1Offset] */
  Ap,
}

/**
 * Generic pattern to compute res: `res = logic(op0, op1)`
 *
 * Generic instruction pattern `opcode(res, dst)` <=> `opcode(logic(op0, op1), dst)`
 * - Op1: res = op1
 * - Add: res = op0 + op1
 * - Mul: res = op0 * op1
 * - Unconstrained: res = Unused
 */
export enum ResLogic {
  /** res = op1 */
  Op1,
  /** res = op0 + op1 */
  Add,
  /** res = op0 * op1 */
  Mul,
  /** res = Unused */
  Unused,
}

/**
 * - Regular: pc = pc + instruction_size(Common Case)
 * - Jump: pc = res (Absolute Jump)
 * - JumpRel: pc = pc + res (Relative Jump)
 * - Jnz: dst == 0 ? pc = pc + instruction_size : pc = pc + op1 (Conditional Relative Jump - Jump if Not Zero)
 */
export enum PcUpdate {
  /** pc = pc + instruction_size (Common Case) */
  Regular,
  /** pc = res (Absolute Jump) */
  Jump,
  /** pc = pc + res (Relative Jump) */
  JumpRel,
  /** dst == 0 ? pc = pc + instruction_size : pc = pc + op1 (Conditional Relative Jump - Jump if Not Zero) */
  Jnz,
}

/**
 * - Ap: ap = ap
 * - AddRes: ap = ap + res
 * - Add1: ap++
 * - Add2: ap = ap + 2
 */
export enum ApUpdate {
  /** ap = ap */
  Ap,
  /** ap = ap + res */
  AddRes,
  /** ap++ */
  Add1,
  /** ap = ap + 2 */
  Add2,
}

/**
 * - Fp: fp = fp (Common Case)
 * - Ap2: fp = ap + 2 (Call instruction)
 * - Dst: fp = dst ("ret" instruction)
 */
export enum FpUpdate {
  /** fp = fp (Common Case) */
  Fp,
  /** fp = ap + 2 (Call instruction) */
  ApPlus2,
  /** fp = dst ("ret" instruction) */
  Dst,
}

/**
 * - NoOp: no-op (No Operation)
 * - Call: call
 * - Ret: ret (Return)
 * - AssertEq: assert equal
 */
export enum Opcode {
  /** No Operation */
  NoOp,
  /** Call instruction */
  Call,
  /** Return instrction */
  Ret,
  /** Assert equal instruction */
  AssertEq,
}

export class Instruction {
  public dstOffset: number;
  public op0Offset: number;
  public op1Offset: number;
  // The register to use as the Destination Operand
  public dstRegister: Register;
  // The register to use as the Operand 0
  public op0Register: Register;
  // The source of the Operand 1
  public op1Source: Op1Source;
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

  /** Value added to the offsets on encoded instructions
   *
   * offset = encodedOffset - BIAS
   */
  static readonly BIAS = BigInt(2 ** 15);

  static default(): Instruction {
    return new Instruction(
      0,
      0,
      0,
      Register.Ap,
      Register.Ap,
      Op1Source.Op0,
      ResLogic.Op1,
      PcUpdate.Regular,
      ApUpdate.Ap,
      FpUpdate.Fp,
      Opcode.NoOp
    );
  }

  constructor(
    dstOffset: number,
    op0Offset: number,
    op1Offset: number,
    dstReg: Register,
    op0Register: Register,
    op1Source: Op1Source,
    resLogic: ResLogic,
    pcUpdate: PcUpdate,
    apUpdate: ApUpdate,
    fpUpdate: FpUpdate,
    opcode: Opcode
  ) {
    this.dstOffset = dstOffset;
    this.op0Offset = op0Offset;
    this.op1Offset = op1Offset;
    this.dstRegister = dstReg;
    this.op0Register = op0Register;
    this.op1Source = op1Source;
    this.resLogic = resLogic;
    this.pcUpdate = pcUpdate;
    this.apUpdate = apUpdate;
    this.fpUpdate = fpUpdate;
    this.opcode = opcode;
  }

  static fromBiased(value: bigint): number {
    return Number(value - Instruction.BIAS);
  }

  static decodeInstruction(encodedInstruction: bigint): Instruction {
    // INVARIANT: The high bit of the encoded instruction must be 0
    const highBit = 1n << 63n;
    if ((highBit & encodedInstruction) !== 0n) {
      throw new HighBitSetError();
    }

    // Structure of the 48 first bits of an encoded instruction:
    // The 3 offsets (Dst, Op0, Op1) are 16-bit signed integers

    // mask for the 16 least significant bits of the instruction
    const mask = 0xffffn;
    const shift = 16n;

    // Get the offset by masking and shifting the encoded instruction
    const dstOffset = this.fromBiased(encodedInstruction & mask);

    let shiftedEncodedInstruction = encodedInstruction >> shift;
    const op0Offset = this.fromBiased(shiftedEncodedInstruction & mask);

    shiftedEncodedInstruction = shiftedEncodedInstruction >> shift;
    const op1Offset = this.fromBiased(shiftedEncodedInstruction & mask);

    // Get the flags by shifting the encoded instruction
    const flags = shiftedEncodedInstruction >> shift;

    // Decoding the flags and the logic of the instruction in the last 16 bits of the instruction
    // dstRegister is located at bits 0-0. We apply a mask of 0x01 (0b1)
    // and shift 0 bits right
    const dstRegisterMask = 0x01n;
    const dstRegisterOff = 0n;
    // op0Register is located at bits 1-1. We apply a mask of 0x02 (0b10)
    // and shift 1 bit right
    const op0RegisterMask = 0x02n;
    const op0RegisterOff = 1n;
    // Op1Source is located at bits 2-4. We apply a mask of 0x1c (0b11100)
    // and shift 2 bits right
    const OperandOneSourceMask = 0x1cn;
    const OperandOneSourceOff = 2n;
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
    const targetdstRegister = (flags & dstRegisterMask) >> dstRegisterOff;
    let dstRegister: Register;
    if (targetdstRegister == 0n) {
      dstRegister = Register.Ap;
    } else {
      dstRegister = Register.Fp;
    }
    // Operand 0 register is either Ap or Fp
    const targetRegister = (flags & op0RegisterMask) >> op0RegisterOff;
    let op0Register: Register;
    if (targetRegister == 0n) {
      op0Register = Register.Ap;
    } else {
      op0Register = Register.Fp;
    }

    const targetOperandOneSource =
      (flags & OperandOneSourceMask) >> OperandOneSourceOff;
    let op1Source: Op1Source;
    switch (targetOperandOneSource) {
      case 0n:
        // op1 = m(op0 + offop1)
        op1Source = Op1Source.Op0;
        break;
      case 1n:
        // op1 = m(pc + offop1)
        op1Source = Op1Source.Pc;
        break;
      case 2n:
        // op1 = m(fp + offop1)
        op1Source = Op1Source.Fp;
        break;
      case 4n:
        // op1 = m(ap + offop1)
        op1Source = Op1Source.Ap;
        break;
      default:
        throw new InvalidOp1Source();
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
        throw new InvalidPcUpdate();
    }

    const targetResLogic = (flags & resLogicMask) >> resLogicOff;
    let resLogic: ResLogic;
    switch (targetResLogic) {
      case 0n:
        // if pc_update == jnz and res_logic == 0 then
        // res is unconstrained else res = op1
        if (pcUpdate == PcUpdate.Jnz) {
          resLogic = ResLogic.Unused;
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
        throw new InvalidResLogic();
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
        throw new InvalidOpcode();
    }

    const targetApUpdate = (flags & apUpdateMask) >> apUpdateOff;
    let apUpdate: ApUpdate;
    switch (targetApUpdate) {
      case 0n:
        // if call with ap_update = 0:  ap = ap + 2
        // else ap = ap
        if (opcode == Opcode.Call) {
          apUpdate = ApUpdate.Add2;
        } else {
          apUpdate = ApUpdate.Ap;
        }
        break;
      case 1n:
        apUpdate = ApUpdate.AddRes;
        break;
      case 2n:
        apUpdate = ApUpdate.Add1;
        break;
      default:
        throw new InvalidApUpdate();
    }

    let fpUpdate: FpUpdate;
    switch (opcode) {
      case Opcode.Call:
        fpUpdate = FpUpdate.ApPlus2;
        break;
      case Opcode.Ret:
        fpUpdate = FpUpdate.Dst;
        break;
      default:
        fpUpdate = FpUpdate.Fp;
    }

    return new Instruction(
      dstOffset,
      op0Offset,
      op1Offset,
      dstRegister,
      op0Register,
      op1Source,
      resLogic,
      pcUpdate,
      apUpdate,
      fpUpdate,
      opcode
    );
  }

  /** The instruction size is 2 if an immediate value, located at Pc + 1, is used. */
  size(): number {
    return this.op1Source == Op1Source.Pc ? 2 : 1;
  }
}
