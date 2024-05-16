import {
  ExpectedFelt,
  ExpectedRelocatable,
  InvalidDst,
  InvalidOp1,
  UnusedResError,
  UndefinedInstruction,
  InvalidOp0,
} from 'errors/virtualMachine';
import { InstructionError } from 'errors/memory';

import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { SegmentValue, isFelt, isRelocatable } from 'primitives/segmentValue';
import { Memory } from 'memory/memory';
import {
  ApUpdate,
  FpUpdate,
  Instruction,
  Opcode,
  PcUpdate,
  Register,
  ResLogic,
} from './instruction';

export class VirtualMachine {
  private currentStep: bigint;
  memory: Memory;
  pc: Relocatable;
  ap: Relocatable;
  fp: Relocatable;

  constructor() {
    this.currentStep = 0n;
    this.memory = new Memory();

    this.pc = new Relocatable(0, 0);
    this.ap = new Relocatable(1, 0);
    this.fp = new Relocatable(1, 0);
  }

  /**
   * Execute one step:
   * - Decode the instruction at PC
   * - Run the instruction
   */
  step(): void {
    const maybeEncodedInstruction = this.memory.get(this.pc);
    if (maybeEncodedInstruction === undefined) {
      throw new UndefinedInstruction();
    }

    if (!isFelt(maybeEncodedInstruction)) {
      throw new InstructionError();
    }

    const encodedInstruction = maybeEncodedInstruction.toBigInt();

    const instruction = Instruction.decodeInstruction(encodedInstruction);

    this.runInstruction(instruction);
  }

  /**
   * Perform the state transition based on the given instruction
   * @param {Instruction} instruction Current instruction
   *
   * NOTE: See Cairo whitepaper 4.5 State Transition
   * for more details
   */
  runInstruction(instruction: Instruction): void {
    const { op0, op1, res, dst } = this.computeStepValues(instruction);

    // TODO should update the trace here

    this.updateRegisters(instruction, op1, res, dst);

    this.currentStep += 1n;
  }

  /**
   * @param {Instruction} instruction Current instruction
   * @returns {Object} Auxiliary values (op0, op1, res, dst)
   * needed to run the given instruction.
   *
   * "They can be computed from the memory values,
   * the three offsets, and the instruction flags."
   */
  computeStepValues(instruction: Instruction): {
    op0: SegmentValue | undefined;
    op1: SegmentValue | undefined;
    res: SegmentValue | undefined;
    dst: SegmentValue | undefined;
  } {
    const {
      dstOffset,
      op0Offset,
      op1Offset,
      dstRegister,
      op0Register,
      op1Register,
      resLogic,
      opcode,
    } = instruction;

    const registers = {
      [Register.Pc]: this.pc,
      [Register.Ap]: this.ap,
      [Register.Fp]: this.fp,
    };

    const op0Addr: Relocatable = registers[op0Register].add(op0Offset);
    const op1Addr: Relocatable = registers[op1Register].add(op1Offset);
    const dstAddr: Relocatable = registers[dstRegister].add(dstOffset);

    let op0: SegmentValue | undefined = this.memory.get(op0Addr);
    let op1: SegmentValue | undefined = this.memory.get(op1Addr);
    let res: SegmentValue | undefined = undefined;
    let dst: SegmentValue | undefined = this.memory.get(dstAddr);

    switch (opcode | resLogic) {
      case Opcode.Call | ResLogic.Op1:
        ({ op0, op1 } = this.validateOperandsCallOpcode(instruction, op0, op1));
        res = op1;
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Add:
        ({ op0, op1 } = this.validateOperandsCallOpcode(instruction, op0, op1));
        res = op0.add(op1);
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Mul:
        ({ op0, op1 } = this.validateOperandsCallOpcode(instruction, op0, op1));
        if (!isFelt(op0)) throw new ExpectedFelt();
        res = op0.mul(op1);
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Unused:
        ({ op0, op1 } = this.validateOperandsCallOpcode(instruction, op0, op1));
        res = undefined;
        dst = this.fp;
        break;

      case Opcode.AssertEq | ResLogic.Op1:
        if (op1 === undefined) op1 = dst;
        res = op1;
        dst = res;
        break;

      case Opcode.AssertEq | ResLogic.Add:
        if (op0 === undefined) {
          if (dst === undefined || op1 === undefined) {
            throw new InvalidOp0();
          }
          op0 = dst.sub(op1);
        }
        if (op1 === undefined) {
          if (dst === undefined || op0 === undefined) {
            throw new InvalidOp1();
          }
          op1 = dst.sub(op0);
        }
        res = op0.add(op1);
        dst = res;
        break;

      case Opcode.AssertEq | ResLogic.Mul:
        if (op0 === undefined) {
          if (dst === undefined || op1 === undefined || !isFelt(dst)) {
            throw new InvalidOp0();
          }
          op0 = dst.div(op1);
        }
        if (!isFelt(op0)) throw new ExpectedFelt();
        if (op1 === undefined) {
          if (dst === undefined || op0 === undefined || !isFelt(dst)) {
            throw new InvalidOp1();
          }
          op1 = dst.div(op0);
        }
        res = op0.mul(op1);
        dst = res;
        break;

      case Opcode.AssertEq | ResLogic.Unused:
        res = undefined;
        dst = res;
        break;

      default:
        switch (resLogic) {
          case ResLogic.Op1:
            res = op1;
            break;
          case ResLogic.Add:
            if (op0 !== undefined && op1 !== undefined) {
              res = op0.add(op1);
            }
            break;
          case ResLogic.Mul:
            if (op0 !== undefined && op1 !== undefined && isFelt(op0)) {
              res = op0.mul(op1);
            }
            break;
          case ResLogic.Unused:
            res = undefined;
            break;
          default:
            throw new Error();
        }
        break;
    }

    if (op0 !== undefined) this.memory.assertEq(op0Addr, op0);
    if (op1 !== undefined) this.memory.assertEq(op1Addr, op1);
    if (dst !== undefined) this.memory.assertEq(dstAddr, dst);

    return {
      op0,
      op1,
      res,
      dst,
    };
  }

  /** Perform checks for Call opcode cases.
   *
   * Compute op0 if not retrieved from memory
   */
  private validateOperandsCallOpcode(
    instruction: Instruction,
    op0: SegmentValue | undefined,
    op1: SegmentValue | undefined
  ): { op0: SegmentValue; op1: SegmentValue } {
    const nextPc = this.pc.add(instruction.size());
    if (op0 === undefined) {
      op0 = nextPc;
    } else if (!op0.eq(nextPc)) throw new InvalidOp0();
    if (op1 === undefined) throw new InvalidOp1();
    return { op0, op1 };
  }

  /**
   * Update the three registers PC, AP and FP.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updateRegisters(
    instruction: Instruction,
    op1: SegmentValue | undefined,
    res: SegmentValue | undefined,
    dst: SegmentValue | undefined
  ): void {
    this.updatePc(instruction, op1, res, dst);
    this.updateAp(instruction, res);
    this.updateFp(instruction, dst);
  }

  /**
   * Update PC to its next value.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updatePc(
    instruction: Instruction,
    op1: SegmentValue | undefined,
    res: SegmentValue | undefined,
    dst: SegmentValue | undefined
  ): void {
    switch (instruction.pcUpdate) {
      case PcUpdate.Regular:
        this.pc = this.pc.add(instruction.size());
        break;

      case PcUpdate.Jump:
        if (res === undefined) throw new UnusedResError();
        if (!isRelocatable(res)) throw new ExpectedRelocatable();
        this.pc = res;
        break;

      case PcUpdate.JumpRel:
        if (res === undefined) throw new UnusedResError();
        if (!isFelt(res)) throw new ExpectedFelt();
        this.pc = this.pc.add(res);
        break;

      case PcUpdate.Jnz:
        if (dst === undefined) throw new InvalidDst();
        if (isFelt(dst) && dst.eq(Felt.ZERO)) {
          this.pc = this.pc.add(instruction.size());
        } else {
          if (op1 === undefined) throw new InvalidOp1();
          if (!isFelt(op1)) throw new ExpectedFelt();
          this.pc = this.pc.add(op1);
        }
        break;
    }
  }

  /**
   * Update AP to its next value.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updateAp(instruction: Instruction, res: SegmentValue | undefined): void {
    switch (instruction.apUpdate) {
      case ApUpdate.AddRes:
        if (res === undefined) throw new UnusedResError();
        if (!isFelt(res)) throw new ExpectedFelt();

        this.ap = this.ap.add(res);
        break;

      case ApUpdate.Add1:
        this.ap = this.ap.add(1);
        break;

      case ApUpdate.Add2:
        this.ap = this.ap.add(2);
        break;
    }
  }

  /**
   * Update FP to its next value.
   *
   * Based on the current instruction and
   * the previously computed auxiliary values.
   */
  updateFp(instruction: Instruction, dst: SegmentValue | undefined): void {
    switch (instruction.fpUpdate) {
      case FpUpdate.ApPlus2:
        this.fp = this.ap.add(2);
        break;

      case FpUpdate.Dst:
        if (dst === undefined) throw new InvalidDst();
        if (isFelt(dst)) {
          this.fp = this.fp.add(dst);
        }
        if (isRelocatable(dst)) {
          this.fp = dst;
        }
        break;
    }
  }
}
