// Instruction is the representation of the first word of each Cairo instruction.
// Some instructions spread over two words when they use an immediate value, so
// representing the first one with this struct is enougth.

import {
  InstructionError,
  HighBitSetError,
  InvalidApUpdate,
  InvalidOperandOneSource,
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

export type OperandOneSource = 'op0' | 'pc' | 'fp' | 'ap';

export type ResultLogic = 'op1' | 'op0 + op1' | 'op0 * op1' | 'unconstrained';

export type PcUpdate =
  | 'no-op'
  | 'pc = res'
  | 'pc = pc + res'
  | 'res != 0 ? pc = op1 : pc += instruction_size';

export type ApUpdate = 'no-op' | 'ap = ap + res' | 'ap++' | 'ap += 2';

export type FpUpdate =
  | 'no-op'
  | 'fp = ap + 2'
  | 'fp = relocatable(dst) || fp += felt(dst)';

export type Opcode = 'no-op' | 'call' | 'return' | 'assert_eq';

export class Instruction {
  public dstOffset: number;
  public operandZeroOffset: number;
  public operandOneOffset: number;
  // The register to use as the Destination Operand
  public dstRegister: RegisterFlag;
  // The register to use as the Operand 0
  public operandZeroRegister: RegisterFlag;
  // The source of the Operand 1
  public operandOneSource: OperandOneSource;
  // The result logic
  public resultLogic: ResultLogic;
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
      'op0',
      'op1',
      'no-op',
      'no-op',
      'no-op',
      'no-op'
    );
  }

  constructor(
    offsetDst: number,
    offsetOp0: number,
    offsetOp1: number,
    desReg: RegisterFlag,
    operandZeroRegister: RegisterFlag,
    operandOneSource: OperandOneSource,
    resultLogic: ResultLogic,
    pcUpdate: PcUpdate,
    apUpdate: ApUpdate,
    fpUpdate: FpUpdate,
    opcode: Opcode
  ) {
    // Check that the offsets are 16-bit signed integers
    SignedInteger16.ensureInt16(offsetDst);
    SignedInteger16.ensureInt16(offsetOp0);
    SignedInteger16.ensureInt16(offsetOp1);

    this.dstOffset = offsetDst;
    this.operandZeroOffset = offsetOp0;
    this.operandOneOffset = offsetOp1;
    this.dstRegister = desReg;
    this.operandZeroRegister = operandZeroRegister;
    this.operandOneSource = operandOneSource;
    this.resultLogic = resultLogic;
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
    // dstRegister is located at bits 0-0. We apply a mask of 0x01 (0b1)
    // and shift 0 bits right
    const dstRegisterMask = 0x01n;
    const dstRegisterOff = 0n;
    // operandZeroRegister is located at bits 1-1. We apply a mask of 0x02 (0b10)
    // and shift 1 bit right
    const operandZeroRegisterMask = 0x02n;
    const operandZeroRegisterOff = 1n;
    // OperandOneSource is located at bits 2-4. We apply a mask of 0x1c (0b11100)
    // and shift 2 bits right
    const OperandOneSourceMask = 0x1cn;
    const OperandOneSourceOff = 2n;
    // resultLogic is located at bits 5-6. We apply a mask of 0x60 (0b1100000)
    // and shift 5 bits right
    const resultLogicMask = 0x60n;
    const resultLogicOff = 5n;
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
    let dstRegister: RegisterFlag;
    if (targetdstRegister == 0n) {
      dstRegister = 'ap';
    } else {
      dstRegister = 'fp';
    }
    // Operand 0 register is either Ap or Fp
    const targetRegisterFlag =
      (flags & operandZeroRegisterMask) >> operandZeroRegisterOff;
    let operandZeroRegister: RegisterFlag;
    if (targetRegisterFlag == 0n) {
      operandZeroRegister = 'ap';
    } else {
      operandZeroRegister = 'fp';
    }

    const targetOperandOneSource =
      (flags & OperandOneSourceMask) >> OperandOneSourceOff;
    let OperandOneSource: OperandOneSource;
    switch (targetOperandOneSource) {
      case 0n:
        // op1 = m(op0 + offop1)
        OperandOneSource = 'op0';
        break;
      case 1n:
        // op1 = m(pc + offop1)
        OperandOneSource = 'pc';
        break;
      case 2n:
        // op1 = m(fp + offop1)
        OperandOneSource = 'fp';
        break;
      case 4n:
        // op1 = m(ap + offop1)
        OperandOneSource = 'ap';
        break;
      default:
        throw new InstructionError(InvalidOperandOneSource);
    }

    const targetPcUpdate = (flags & pcUpdateMask) >> pcUpdateOff;
    let pcUpdate: PcUpdate;
    switch (targetPcUpdate) {
      case 0n:
        // pc = pc + instruction size
        pcUpdate = 'no-op';
        break;
      case 1n:
        // pc = res
        pcUpdate = 'pc = res';
        break;
      case 2n:
        // pc = pc + res
        pcUpdate = 'pc = pc + res';
        break;
      case 4n:
        // if dst != 0 then pc = pc + instruction_size else pc + op1
        pcUpdate = 'res != 0 ? pc = op1 : pc += instruction_size';
        break;
      default:
        throw new InstructionError(InvalidPcUpdate);
    }

    const targetResultLogic = (flags & resultLogicMask) >> resultLogicOff;
    let resultLogic: ResultLogic;
    switch (targetResultLogic) {
      case 0n:
        // if pc_update == jnz and res_logic == 0 then
        // res is unconstrained else res = op1
        if (pcUpdate == 'res != 0 ? pc = op1 : pc += instruction_size') {
          resultLogic = 'unconstrained';
        } else {
          resultLogic = 'op1';
        }
        break;
      case 1n:
        // res = op0 + op1
        resultLogic = 'op0 + op1';
        break;
      case 2n:
        // res = op0 * op1
        resultLogic = 'op0 * op1';
        break;
      default:
        throw new InstructionError(InvalidResultLogic);
    }

    const targetOpcode = (flags & opcodeMask) >> opcodeOff;
    let opcode: Opcode;
    switch (targetOpcode) {
      case 0n:
        // fp = fp
        opcode = 'no-op';
        break;
      case 1n:
        // fp = ap + 2
        opcode = 'call';
        break;
      case 2n:
        // Return: fp = dst
        opcode = 'return';
        break;
      case 4n:
        // Assert equal: assert dst == op0, fp = fp
        opcode = 'assert_eq';
        break;
      default:
        throw new InstructionError(InvalidOpcode);
    }

    const targetApUpdate = (flags & apUpdateMask) >> apUpdateOff;
    let apUpdate: ApUpdate;
    switch (targetApUpdate) {
      case 0n:
        // if call with ap_update = 0:  ap = ap + 2
        // else ap = ap
        if (opcode == 'call') {
          apUpdate = 'ap += 2';
        } else {
          apUpdate = 'no-op';
        }
        break;
      case 1n:
        apUpdate = 'ap = ap + res';
        break;
      case 2n:
        apUpdate = 'ap++';
        break;
      default:
        throw new InstructionError(InvalidApUpdate);
    }

    let fpUpdate: FpUpdate;
    switch (opcode) {
      case 'call':
        fpUpdate = 'fp = ap + 2';
        break;
      case 'return':
        fpUpdate = 'fp = relocatable(dst) || fp += felt(dst)';
        break;
      default:
        fpUpdate = 'no-op';
    }

    return new Instruction(
      offsetDst,
      offsetOp0,
      offsetOp1,
      dstRegister,
      operandZeroRegister,
      OperandOneSource,
      resultLogic,
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
    if (this.operandOneSource == 'pc') {
      return 2;
    }
    return 1;
  }
}
