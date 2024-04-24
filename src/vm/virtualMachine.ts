import {
  ExpectedFelt,
  ExpectedRelocatable,
  InvalidDstOperand,
  InvalidOperand1,
  UnconstrainedResError,
  VirtualMachineError,
  Op0NotRelocatable,
  Op0Undefined,
  Op1ImmediateOffsetError,
} from 'errors/virtualMachine';
import { Felt } from 'primitives/felt';
import { Instruction, Opcode, PcUpdate, OpLogic } from './instruction';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { InstructionError } from 'errors/memory';

import {
  DiffAssertValuesError,
  EndOfInstructionsError,
  InvalidOperand0,
} from 'errors/virtualMachine';
import { Memory } from 'memory/memory';
import { ProgramCounter, MemoryPointer } from 'primitives/relocatable';

import { Op1Source } from 'vm/instruction';

// operand 0 is the first operand in the right side of the computation
// operand 1 is the second operand in the right side of the computation
// res is the result of the computation
// dst is the destination of the computation i.e. the left side of the computation
// Example:
// assert [fp - 3] = [ap + 7] * [ap + 8]
// In this case, op0 = [ap + 7], op1 = [ap + 8], res = op0 * op1, dst = [fp - 3]
export type Operands = {
  op0: MaybeRelocatable | undefined;
  op1: MaybeRelocatable | undefined;
  res: MaybeRelocatable | undefined;
  dst: MaybeRelocatable | undefined;
};

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

  // Operand1 base address can be: ap, fp, pc or op0.
  // Operand1 can be ap + offset, fp + offset, pc + 1 or op0 + offset.
  computeOp1Address(
    op1Source: Op1Source,
    op1Offset: number,
    op0: MaybeRelocatable | undefined
  ): Relocatable {
    let baseAddr: Relocatable;
    switch (op1Source) {
      case 'ap':
        baseAddr = this.ap;
        break;
      case 'fp':
        baseAddr = this.fp;
        break;
      case 'pc':
        // In case of immediate as the source, the offset
        // has to be 1, otherwise we return an error.
        if (op1Offset == 1) {
          baseAddr = this.pc;
        } else {
          throw new VirtualMachineError(Op1ImmediateOffsetError);
        }
        break;
      case 'op0':
        // In case of operand 0 as the source, we have to check that
        // operand 0 is not undefined.
        if (op0 === undefined) {
          throw new VirtualMachineError(Op0Undefined);
        }

        if (!Relocatable.isRelocatable(op0)) {
          throw new VirtualMachineError(Op0NotRelocatable);
        }
        baseAddr = op0;
    }

    // We then apply the offset to the base address.
    return baseAddr.add(op1Offset);
  }

  step(): void {
    const maybeEncodedInstruction = this.memory.get(this.pc);
    if (maybeEncodedInstruction === undefined) {
      throw new VirtualMachineError(EndOfInstructionsError);
    }

    if (!(maybeEncodedInstruction instanceof Felt)) {
      throw new VirtualMachineError(InstructionError);
    }

    const encodedInstruction = maybeEncodedInstruction.toBigInt();

    // decode and run instruction
    const instruction = Instruction.decodeInstruction(encodedInstruction);

    return this.runInstruction(instruction);
  }

  // Run the current instruction
  runInstruction(instruction: Instruction): void {
    const operands = this.computeOperands(instruction);

    this.opcodeAssertion(instruction, operands);

    // TODO should update the trace here

    this.updateRegisters(instruction, operands);

    this.currentStep += 1n;

    return;
  }

  // Compute the operands of an instruction. The VM can either
  // fetch them from memory and if it fails to do so, it can
  // deduce them from the instruction itself.
  computeOperands(instruction: Instruction): Operands {
    let res: MaybeRelocatable | undefined = undefined;

    // Compute the destination address based on the dstRegister and
    // the offset
    // Example: const dstAddr = this.fp.add(5) == fp + 5;
    const dstAddr = this[instruction.dstRegister].add(instruction.dstOffset);
    let dst = this.memory.get(dstAddr);

    // Compute the first operand address based on the op0Register and
    // the offset
    const op0Addr = this[instruction.op0Register].add(instruction.op0Offset);
    let op0 = this.memory.get(op0Addr);

    // Compute the second operand address based on the op1Source and
    // the offset
    const op1Addr = this.computeOp1Address(
      instruction.op1Source,
      instruction.op1Offset,
      op0
    );
    let op1 = this.memory.get(op1Addr);

    // If op0 is undefined, then we can deduce it from the instruction, dst and op1
    // We also deduce the result based on the result logic
    if (op0 === undefined) {
      const deducedOp0 = this.deduceOp0(instruction, dst, op1);

      if (deducedOp0 !== undefined) {
        this.memory.write(op0Addr, deducedOp0);
      }
      op0 = deducedOp0;
    }

    // If operand 1 is undefined, then we can deduce it from the instruction,
    // destination and operand 0.
    // We also deduce the result based on the result logic
    if (op1 === undefined) {
      const deducedOp1 = this.deduceOp1(instruction, dst, op0);

      if (deducedOp1 !== undefined) {
        this.memory.write(op1Addr, deducedOp1);
      }
    }

    // If res is undefined, then we can compute it from op0 and op1
    if (res === undefined) {
      const computedRes = this.computeRes(
        instruction,
        op0 as MaybeRelocatable,
        op1 as MaybeRelocatable
      );

      res = computedRes;
    }

    // If dst is undefined, then we can deduce it from the instruction and res
    if (dst === undefined) {
      const deducedDst = this.deduceDst(instruction, res);

      if (deducedDst !== undefined) {
        this.memory.write(dstAddr, deducedDst);
      }
      dst = deducedDst;
    }

    return {
      op0,
      op1,
      res,
      dst,
    };
  }

  // Deduce the operands of an instruction based on the instruction
  // itself. Deduces op0 and result when possible.
  deduceOp0(
    instruction: Instruction,
    dst: MaybeRelocatable | undefined,
    op1: MaybeRelocatable | undefined
  ): MaybeRelocatable | undefined {
    // We can deduce the first operand from the destination and the second
    // operand, based on which opcode is used.
    switch (instruction.opcode) {
      // If the opcode is a call, then the first operand can be found at pc
      // + instruction size.
      case 'call':
        // op0 = pc + 1 OR op0 = pc + 2
        return this.pc.add(instruction.size());

      // If the opcode is an assert eq, then we can deduce the first operand
      // based on the result logic.
      // For add, res = op0 + op1 => op0 = res - op1.
      // For mul, res = op0 * op1 => op0 = res / op1.
      case 'assert_eq':
        switch (instruction.opLogic) {
          case 'op0 + op1':
            // op0 = res - op1
            if (dst !== undefined && op1 !== undefined) {
              return dst.sub(op1);
            }

          case 'op0 * op1':
            if (dst !== undefined && op1 !== undefined) {
              try {
                if (!Felt.isFelt(dst)) {
                  throw new Error();
                }
                // op0 = res / op1
                return dst.div(op1);
              } catch (err) {
                return undefined;
              }
            }
            break;
        }
      default:
        return undefined;
    }
  }

  deduceOp1(
    instruction: Instruction,
    dst: MaybeRelocatable | undefined,
    op0: MaybeRelocatable | undefined
  ): MaybeRelocatable | undefined {
    if (instruction.opcode !== 'assert_eq') {
      return undefined;
    }
    switch (instruction.opLogic) {
      // If the result logic is op1, then dst = op1.
      case 'op1':
        return dst;

      case 'op0 + op1':
        // dst := res = op0 + op1
        // op1 = op0 - dst
        if (dst !== undefined && op0 !== undefined) {
          return dst.sub(op0);
        }
        break;
      case 'op0 * op1':
        // dst := res = op0 * op1
        // op1 = dst / op0
        if (dst !== undefined && op0 !== undefined) {
          try {
            if (!Felt.isFelt(dst)) {
              throw new Error();
            }
            return dst.div(op0);
          } catch (err) {
            return undefined;
          }
        }
        break;
    }
    return undefined;
  }

  // Compute the result of an instruction based on result logic
  // for the instruction.
  computeRes(
    instruction: Instruction,
    op0: MaybeRelocatable,
    op1: MaybeRelocatable
  ): MaybeRelocatable | undefined {
    switch (instruction.opLogic) {
      case 'op1':
        return op1;
      case 'op0 + op1':
        return op0.add(op1);
      case 'op0 * op1':
        if (!Felt.isFelt(op0)) {
          throw new VirtualMachineError(ExpectedFelt);
        }
        return op0.mul(op1);
      case 'unconstrained':
        return undefined;
    }
  }

  // Deduce the destination of an instruction. We can only deduce
  // for assert eq and call instructions.
  deduceDst(
    instruction: Instruction,
    res: MaybeRelocatable | undefined
  ): MaybeRelocatable | undefined {
    switch (instruction.opcode) {
      // For an assert equal, we have dst := res
      case 'assert_eq':
        return res;
      // For a call instruction, we have dst := fp
      case 'call':
        return this.fp;
      default:
        return undefined;
    }
  }

  // Update the registers based on the instruction.
  updateRegisters(instruction: Instruction, operands: Operands): void {
    this.updatePc(instruction, operands);

    this.updateFp(instruction, operands);

    this.updateAp(instruction, operands);
  }

  // Update the pc update logic based on the instruction.
  updatePc(instruction: Instruction, operands: Operands): void {
    switch (instruction.pcUpdate) {
      // If the pc update logic is regular, then we increment the pc by
      // the instruction size.
      case 'pc = pc':
        this.incrementPc(instruction.size());
        break;
      // If the pc update logic is jump, then we set the pc to the
      // result.
      case 'pc = res':
        if (operands.res === undefined) {
          throw new VirtualMachineError(UnconstrainedResError);
        }
        if (!Relocatable.isRelocatable(operands.res)) {
          throw new VirtualMachineError(ExpectedRelocatable);
        }
        this.pc = operands.res;
        break;
      // If the pc update logic is jump rel, then we add the result
      // to the pc.
      case 'pc = pc + res':
        if (operands.res === undefined) {
          throw new VirtualMachineError(UnconstrainedResError);
        }

        if (!Felt.isFelt(operands.res)) {
          throw new VirtualMachineError(ExpectedFelt);
        }
        this.pc = this.pc.add(operands.res);
        break;
      // If the pc update logic is jnz, then we check if the destination
      // is zero. If it is, then we increment the pc by the instruction (default)
      // If it is not, then we add the op1 to the pc.
      case 'res != 0 ? pc = op1 : pc += instruction_size':
        if (operands.dst === undefined) {
          throw new VirtualMachineError(InvalidDstOperand);
        }
        if (Felt.isFelt(operands.dst) && operands.dst.eq(Felt.ZERO)) {
          this.incrementPc(instruction.size());
        } else {
          if (operands.op1 === undefined) {
            throw new VirtualMachineError(InvalidOperand1);
          }
          if (!Felt.isFelt(operands.op1)) {
            throw new VirtualMachineError(ExpectedFelt);
          }
          this.pc = this.pc.add(operands.op1);
        }
        break;
    }
  }

  // Update the fp based on the fp update logic of the instruction.
  updateFp(instruction: Instruction, operands: Operands): void {
    switch (instruction.fpUpdate) {
      // If the fp update logic is ap plus 2, then we add 2 to the ap
      case 'fp = ap + 2':
        this.fp = this.ap.add(2);
        break;
      // If the fp update logic is dst, then we add the destination
      // to fp if dst is a felt, or set the fp to the destination
      // if a relocatable.
      case 'fp = relocatable(dst) || fp += felt(dst)':
        if (operands.dst === undefined) {
          throw new VirtualMachineError(InvalidDstOperand);
        }
        if (Felt.isFelt(operands.dst)) {
          this.fp = this.fp.add(operands.dst);
        }
        if (Relocatable.isRelocatable(operands.dst)) {
          this.fp = operands.dst;
        }
        break;
    }
  }

  // Update the ap based on the ap update logic of the instruction.
  updateAp(instruction: Instruction, operands: Operands): void {
    switch (instruction.apUpdate) {
      // If the ap update logic is add, then we add the result to the ap.
      case 'ap = ap + res':
        if (operands.res === undefined) {
          throw new VirtualMachineError(UnconstrainedResError);
        }
        if (!Felt.isFelt(operands.res)) {
          throw new VirtualMachineError(ExpectedFelt);
        }

        this.ap = this.ap.add(operands.res);
        break;
      // If the ap update logic is add 1, then we add 1 to the ap.
      case 'ap++':
        this.ap = this.ap.add(1);
        break;
      // If the ap update logic is add 2, then we add 2 to the ap.
      case 'ap += 2':
        this.ap = this.ap.add(2);
        break;
    }
  }

  // When using the assert or the call opcode, we need to assert that the following
  // conditions are met:
  //    - For assert eq, res = dst
  //    - For call, op0 = pc + instruction size and dst = fp
  opcodeAssertion(instruction: Instruction, operands: Operands): void {
    switch (instruction.opcode) {
      // For a assert eq, check that res is defined and equals dst.
      // This is because dst represents the left side of the computation, and
      // res represents the right side of the computation.
      case 'assert_eq':
        if (operands.res === undefined) {
          throw new VirtualMachineError(UnconstrainedResError);
        }
        if (operands.dst !== operands.res) {
          throw new VirtualMachineError(DiffAssertValuesError);
        }
        break;
      // For a call, check that op0 = pc + instruction size and dst = fp.
      // op0 is used to store the return pc (the address of the instruction
      // following the call instruction). dst is used to store the frame pointer.
      case 'call':
        const nextPc = this.pc.add(instruction.size());
        if (operands.op0 === undefined || !nextPc.eq(operands.op0)) {
          throw new VirtualMachineError(InvalidOperand0);
        }
        if (this.fp !== operands.dst) {
          throw new VirtualMachineError(InvalidDstOperand);
        }
        break;
    }
  }
}
