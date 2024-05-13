// Instruction is the representation of the first word of each Cairo instruction.
// Some instructions spread over two words when they use an immediate value, so
// representing the first one with this struct is enough.

import {
  HighBitSetError,
  InvalidApUpdate,
  InvalidDstRegister,
  InvalidOp0Register,
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

/** The three registers of the Cairo machine
 * - Pc: Program Counter - Contains the memory address of the current instruction to be executed
 * - Ap: Allocation Pointer - Points to the first memory cell that has not been used by the program so far (Convention)
 * - Fp: Frame Pointer - Points to the beginning of the stack frame of the current function
 */
export enum Register {
  /**
   * Program Counter
   *
   * Contains the memory address of the current instruction to be executed
   */
  Pc,
  /**
   * Allocation Pointer
   *
   * Points to the first memory cell that has not been used by the program so far (Convention)
   */
  Ap,
  /**
   * Frame Pointer
   *
   * Points to the beginning of the stack frame of the current function
   */
  Fp,
}

/**
 * Generic pattern to compute res: `res = logic(op0, op1)`
 *
 * Generic instruction pattern `opcode(res, dst)` <=> `opcode(logic(op0, op1), dst)`
 * - Op1: res = op1
 * - Add: res = op0 + op1
 * - Mul: res = op0 * op1
 * - Unused: res = Unused
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
 * - Regular: pc = pc + instruction_size (Common Case)
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
  public op1Source: Register;
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
      Register.Ap,
      ResLogic.Op1,
      PcUpdate.Regular,
      ApUpdate.Ap,
      FpUpdate.Fp,
      Opcode.NoOp
    );
  }

  /**
   *
   * @param dstOffset
   * @param op0Offset
   * @param op1Offset
   * @param dstReg
   * @param op0Register
   * @param op1Source
   * @param resLogic
   * @param pcUpdate
   * @param apUpdate
   * @param fpUpdate
   * @param opcode
   */
  constructor(
    dstOffset: number,
    op0Offset: number,
    op1Offset: number,
    dstReg: Register,
    op0Register: Register,
    op1Source: Register,
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
    if (encodedInstruction >> 63n) {
      throw new HighBitSetError();
    }

    const dstOffset = this.fromBiased(encodedInstruction & 0xffffn);
    const op0Offset = this.fromBiased((encodedInstruction >> 16n) & 0xffffn);
    let op1Offset = this.fromBiased((encodedInstruction >> 32n) & 0xffffn);

    const flags = encodedInstruction >> 48n;

    const dstRegisterFlag = flags & 0b1n;
    const op0RegisterFlag = (flags >> 1n) & 0b1n;
    const op1SourceFlag = (flags >> 2n) & 0b111n;
    const resLogicFlag = (flags >> 5n) & 0b11n;
    const pcUpdateFlag = (flags >> 7n) & 0b111n;
    const apUpdateFlag = (flags >> 10n) & 0b11n;
    const opcodeFlag = (flags >> 12n) & 0b111n;

    let dstRegister;
    let op0Register;
    let op1Source: Register;
    let resLogic: ResLogic;
    let pcUpdate: PcUpdate;
    let apUpdate: ApUpdate;
    let opcode: Opcode;
    let fpUpdate: FpUpdate;

    switch (dstRegisterFlag) {
      case 0n:
        dstRegister = Register.Ap;
        break;
      case 1n:
        dstRegister = Register.Fp;
        break;
      default:
        throw new InvalidDstRegister();
    }

    switch (op0RegisterFlag) {
      case 0n:
        op0Register = Register.Ap;
        break;
      case 1n:
        op0Register = Register.Fp;
        break;
      default:
        throw new InvalidOp0Register();
    }

    switch (op1SourceFlag) {
      case 0n:
        op1Source = op0Register;
        op1Offset += op0Offset;
        break;
      case 1n:
        op1Source = Register.Pc;
        break;
      case 2n:
        op1Source = Register.Fp;
        break;
      case 4n:
        op1Source = Register.Ap;
        break;
      default:
        throw new InvalidOp1Source();
    }

    switch (pcUpdateFlag) {
      case 0n:
        pcUpdate = PcUpdate.Regular;
        break;
      case 1n:
        pcUpdate = PcUpdate.Jump;
        break;
      case 2n:
        pcUpdate = PcUpdate.JumpRel;
        break;
      case 4n:
        pcUpdate = PcUpdate.Jnz;
        break;
      default:
        throw new InvalidPcUpdate();
    }

    switch (resLogicFlag) {
      case 0n:
        resLogic = pcUpdate === PcUpdate.Jnz ? ResLogic.Unused : ResLogic.Op1;
        break;
      case 1n:
        resLogic = ResLogic.Add;
        break;
      case 2n:
        resLogic = ResLogic.Mul;
        break;
      default:
        throw new InvalidResLogic();
    }

    switch (opcodeFlag) {
      case 0n:
        opcode = Opcode.NoOp;
        break;
      case 1n:
        opcode = Opcode.Call;
        break;
      case 2n:
        opcode = Opcode.Ret;
        break;
      case 4n:
        opcode = Opcode.AssertEq;
        break;
      default:
        throw new InvalidOpcode();
    }

    switch (apUpdateFlag) {
      case 0n:
        apUpdate =
          opcode == Opcode.Call
            ? (apUpdate = ApUpdate.Add2)
            : (apUpdate = ApUpdate.Ap);
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
    return this.op1Source == Register.Pc ? 2 : 1;
  }
}
