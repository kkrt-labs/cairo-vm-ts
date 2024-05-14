import {
  ExpectedFelt,
  ExpectedRelocatable,
  InvalidDst,
  InvalidOp1,
  UnusedResError,
} from 'errors/virtualMachine';
import { Felt } from 'primitives/felt';
import {
  ApUpdate,
  FpUpdate,
  Instruction,
  Opcode,
  PcUpdate,
  Register,
  ResLogic,
} from './instruction';
import { Relocatable } from 'primitives/relocatable';
import { InstructionError } from 'errors/memory';

import {
  DiffAssertValuesError,
  EndOfInstructionsError,
  InvalidOp0,
} from 'errors/virtualMachine';
import { Memory } from 'memory/memory';
import { ProgramCounter, MemoryPointer } from 'primitives/relocatable';

import { SegmentValue, isFelt, isRelocatable } from 'primitives/segmentValue';
import {
  InvalidDstRegister,
  InvalidOp0Register,
  InvalidOp1Register,
} from 'errors/instruction';

export class VirtualMachine {
  private currentStep: bigint;
  memory: Memory;
  pc: ProgramCounter;
  ap: MemoryPointer;
  fp: MemoryPointer;

  constructor() {
    this.currentStep = 0n;
    this.memory = new Memory();

    this.pc = new ProgramCounter(0);
    this.ap = new MemoryPointer(0);
    this.fp = new MemoryPointer(0);
  }

  setRegisters(pc: number, ap: number, fp: number): void {
    this.pc = new ProgramCounter(pc);
    this.ap = new MemoryPointer(ap);
    this.fp = new MemoryPointer(fp);
  }

  incrementPc(instructionSize: number): void {
    this.pc = this.pc.add(instructionSize);
  }

  step(): void {
    const maybeEncodedInstruction = this.memory.get(this.pc);
    if (maybeEncodedInstruction === undefined) {
      throw new EndOfInstructionsError();
    }

    if (!isFelt(maybeEncodedInstruction)) {
      throw new InstructionError();
    }

    const encodedInstruction = maybeEncodedInstruction.toBigInt();

    const instruction = Instruction.decodeInstruction(encodedInstruction);

    return this.runInstruction(instruction);
  }

  // Run the current instruction
  runInstruction(instruction: Instruction): void {
    const { op0, op1, res, dst } = this.computeAuxValues(instruction);

    // TODO should update the trace here

    this.updateRegisters(instruction, op1, res, dst);

    this.currentStep += 1n;

    return;
  }

  /**
   * @param instruction
   * @returns Auxiliary values (op0, op1, res, dst)
   * needed to run the given instruction.
   *
   * They can be computed from the memory values,
   * the three offsets, and the instruction flags.
   *
   * NOTE: See Cairo whitepaper 4.5 State Transition
   * for formal definition
   */
  computeAuxValues(instruction: Instruction): {
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

    let dstAddr: Relocatable;
    let op0Addr: Relocatable;
    let op1Addr: Relocatable;

    let res: SegmentValue | undefined;
    let dst: SegmentValue | undefined;
    let op0: SegmentValue | undefined;
    let op1: SegmentValue | undefined;

    // Compute the destination address based
    // on the dstRegister and the offset
    // Example: const dstAddr = this.fp.add(5) == fp + 5;
    switch (dstRegister) {
      case Register.Ap:
        dstAddr = this.ap.add(dstOffset);
        break;
      case Register.Fp:
        dstAddr = this.fp.add(dstOffset);
        break;
      default:
        throw new InvalidDstRegister();
    }
    dst = this.memory.get(dstAddr);

    // Compute the first operand address based
    // on the op0Register and the offset
    switch (op0Register) {
      case Register.Ap:
        op0Addr = this.ap.add(op0Offset);
        break;
      case Register.Fp:
        op0Addr = this.fp.add(op0Offset);
        break;
      default:
        throw new InvalidOp0Register();
    }
    op0 = this.memory.get(op0Addr);

    // Compute the second operand address based
    // on the op1Register and the offset
    switch (op1Register) {
      case Register.Ap:
        op1Addr = this.ap.add(op1Offset);
        break;
      case Register.Fp:
        op1Addr = this.fp.add(op1Offset);
        break;
      case Register.Pc:
        op1Addr = this.pc.add(op1Offset);
        break;
      default:
        throw new InvalidOp1Register();
    }
    op1 = this.memory.get(op1Addr);

    switch (opcode | resLogic) {
      case Opcode.Call | ResLogic.Op1:
        ({ op0, op1 } = this.checkCallOpcode(instruction, op0, op1));
        res = op1;
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Add:
        ({ op0, op1 } = this.checkCallOpcode(instruction, op0, op1));
        res = op0.add(op1);
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Mul:
        ({ op0, op1 } = this.checkCallOpcode(instruction, op0, op1));
        if (!isFelt(op0)) throw new ExpectedFelt();
        res = op0.mul(op1);
        dst = this.fp;
        break;

      case Opcode.Call | ResLogic.Unused:
        ({ op0, op1 } = this.checkCallOpcode(instruction, op0, op1));
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
          if (dst !== undefined && op1 !== undefined) {
            op0 = dst.sub(op1);
          } else throw new InvalidOp0();
        }
        if (op1 === undefined) {
          if (dst !== undefined && op0 !== undefined) {
            op1 = dst.sub(op0);
          } else throw new InvalidOp1();
        }
        res = op0.add(op1);
        dst = res;
        break;

      case Opcode.AssertEq | ResLogic.Mul:
        if (op0 === undefined) {
          if (dst !== undefined && op1 !== undefined && isFelt(dst)) {
            op0 = dst.div(op1);
          } else throw new InvalidOp0();
        }
        if (op1 === undefined) {
          if (dst !== undefined && op0 !== undefined && isFelt(dst)) {
            op1 = dst.div(op0);
          } else throw new InvalidOp1();
        }
        if (!isFelt(op0)) throw new ExpectedFelt();
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

  checkCallOpcode(
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

  // Update the registers based on the instruction.
  updateRegisters(
    instruction: Instruction,
    op1: SegmentValue | undefined,
    res: SegmentValue | undefined,
    dst: SegmentValue | undefined
  ): void {
    this.updatePc(instruction, op1, res, dst);
    this.updateFp(instruction, dst);
    this.updateAp(instruction, res);
  }

  // Update the pc update logic based on the instruction.
  updatePc(
    instruction: Instruction,
    op1: SegmentValue | undefined,
    res: SegmentValue | undefined,
    dst: SegmentValue | undefined
  ): void {
    switch (instruction.pcUpdate) {
      // If the pc update logic is regular, then we increment the pc by
      // the instruction size.
      case PcUpdate.Regular:
        this.incrementPc(instruction.size());
        break;
      // If the pc update logic is jump, then we set the pc to the
      // result.
      case PcUpdate.Jump:
        if (res === undefined) {
          throw new UnusedResError();
        }
        if (!isRelocatable(res)) {
          throw new ExpectedRelocatable();
        }
        this.pc = res;
        break;
      // If the pc update logic is jump rel, then we add the result
      // to the pc.
      case PcUpdate.JumpRel:
        if (res === undefined) {
          throw new UnusedResError();
        }

        if (!isFelt(res)) {
          throw new ExpectedFelt();
        }
        this.pc = this.pc.add(res);
        break;
      // If the pc update logic is jnz, then we check if the destination
      // is zero. If it is, then we increment the pc by the instruction (default)
      // If it is not, then we add the op1 to the pc.
      case PcUpdate.Jnz:
        if (dst === undefined) {
          throw new InvalidDst();
        }
        if (isFelt(dst) && dst.eq(Felt.ZERO)) {
          this.incrementPc(instruction.size());
        } else {
          if (op1 === undefined) {
            throw new InvalidOp1();
          }
          if (!isFelt(op1)) {
            throw new ExpectedFelt();
          }
          this.pc = this.pc.add(op1);
        }
        break;
    }
  }

  // Update the fp based on the fp update logic of the instruction.
  updateFp(instruction: Instruction, dst: SegmentValue | undefined): void {
    switch (instruction.fpUpdate) {
      // If the fp update logic is ap plus 2, then we add 2 to the ap
      case FpUpdate.ApPlus2:
        this.fp = this.ap.add(2);
        break;
      // If the fp update logic is dst, then we add the destination
      // to fp if dst is a felt, or set the fp to the destination
      // if a relocatable.
      case FpUpdate.Dst:
        if (dst === undefined) {
          throw new InvalidDst();
        }
        if (isFelt(dst)) {
          this.fp = this.fp.add(dst);
        }
        if (isRelocatable(dst)) {
          this.fp = dst;
        }
        break;
    }
  }

  // Update the ap based on the ap update logic of the instruction.
  updateAp(instruction: Instruction, res: SegmentValue | undefined): void {
    switch (instruction.apUpdate) {
      // If the ap update logic is add, then we add the result to the ap.
      case ApUpdate.AddRes:
        if (res === undefined) {
          throw new UnusedResError();
        }
        if (!isFelt(res)) {
          throw new ExpectedFelt();
        }

        this.ap = this.ap.add(res);
        break;
      // If the ap update logic is add 1, then we add 1 to the ap.
      case ApUpdate.Add1:
        this.ap = this.ap.add(1);
        break;
      // If the ap update logic is add 2, then we add 2 to the ap.
      case ApUpdate.Add2:
        this.ap = this.ap.add(2);
        break;
    }
  }

  // When using the assert or the call opcode, we need to assert that the following
  // conditions are met:
  //    - For assert eq, res = dst
  //    - For call, op0 = pc + instruction size and dst = fp
  opcodeAssertion(
    instruction: Instruction,
    op0: SegmentValue | undefined,
    res: SegmentValue | undefined,
    dst: SegmentValue | undefined
  ): void {
    switch (instruction.opcode) {
      // For a assert eq, check that res is defined and equals dst.
      // This is because dst represents the left side of the computation, and
      // res represents the right side of the computation.
      case Opcode.AssertEq:
        if (res === undefined) {
          throw new UnusedResError();
        }
        if (dst !== res) {
          throw new DiffAssertValuesError();
        }
        break;
      // For a call, check that op0 = pc + instruction size and dst = fp.
      // op0 is used to store the return pc (the address of the instruction
      // following the call instruction). dst is used to store the frame pointer.
      case Opcode.Call:
        const nextPc = this.pc.add(instruction.size());
        if (op0 === undefined || !nextPc.eq(op0)) {
          throw new InvalidOp0();
        }
        if (this.fp !== dst) {
          throw new InvalidDst();
        }
        break;
    }
  }
}
