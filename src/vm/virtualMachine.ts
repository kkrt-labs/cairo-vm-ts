import { MemorySegmentManager } from 'memory/memoryManager';
import {
  ExpectedFelt,
  ExpectedRelocatable,
  InvalidDstOperand,
  InvalidOperand1,
  UnconstrainedResError,
  VirtualMachineError,
} from 'errors/virtualMachine';
import { Felt } from 'primitives/felt';
import { UnsignedInteger } from 'primitives/uint';
import { RunContext } from 'run-context/runContext';
import {
  ApUpdate,
  FpUpdate,
  Instruction,
  Opcode,
  PcUpdate,
  ResLogic,
} from './instruction';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { InstructionError } from 'errors/memory';

import {
  DiffAssertValuesError,
  EndOfInstructionsError,
  InvalidOperand0,
} from 'errors/virtualMachine';

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
  runContext: RunContext;
  private currentStep: bigint;
  segments: MemorySegmentManager;

  constructor() {
    this.currentStep = 0n;
    this.segments = new MemorySegmentManager();
    this.runContext = RunContext.default();
  }

  step(): void {
    const maybeEncodedInstruction = this.segments.memory.get(
      this.runContext.pc
    );
    if (maybeEncodedInstruction === undefined) {
      throw new VirtualMachineError(EndOfInstructionsError);
    }

    const encodedInstruction = maybeEncodedInstruction;

    if (!(encodedInstruction instanceof Felt)) {
      throw new VirtualMachineError(InstructionError);
    }

    const encodedInstructionUint = encodedInstruction.toUint64();

    // decode and run instruction
    const instruction = Instruction.decodeInstruction(encodedInstructionUint);

    return this.runInstruction(instruction);
  }

  // Run the current instruction
  runInstruction(instruction: Instruction): void {
    const operands = this.computeOperands(instruction);

    this.opcodeAssertion(instruction, operands);

    // TODO should update the trace here

    this.updateRegisters(instruction, operands);

    this.currentStep += 1n;
    UnsignedInteger.ensureUint64(this.currentStep);

    return;
  }

  // Compute the operands of an instruction. The VM can either
  // fetch them from memory and if it fails to do so, it can
  // deduce them from the instruction itself.
  computeOperands(instruction: Instruction): Operands {
    let res: MaybeRelocatable | undefined = undefined;
    // Compute the destination address based on the dstReg and
    // the offset
    const dstAddr = this.runContext.computeAddress(
      instruction.dstReg,
      instruction.offDst
    );

    let dst = this.segments.memory.get(dstAddr);

    // Compute the first operand address based on the op0Reg and
    // the offset
    const op0Addr = this.runContext.computeAddress(
      instruction.op0Reg,
      instruction.offOp0
    );

    let op0 = this.segments.memory.get(op0Addr);

    // Compute the second operand address based on the op1Src and
    // the offset
    const op1Addr = this.runContext.computeOp1Address(
      instruction.op1Src,
      instruction.offOp1,
      op0
    );

    let op1 = this.segments.memory.get(op1Addr);

    // If op0 is undefined, then we can deduce it from the instruction, dst and op1
    // We also deduce the result based on the result logic
    if (op0 === undefined) {
      const deducedValues = this.deduceOp0(instruction, dst, op1);

      const [deducedOp0, deducedRes] = deducedValues;
      if (deducedOp0 !== undefined) {
        this.segments.insert(op0Addr, deducedOp0);
      }
      op0 = deducedOp0;
      res = deducedRes;
    }

    // If operand 1 is undefined, then we can deduce it from the instruction,
    // destination and operand 0.
    // We also deduce the result based on the result logic
    if (op1 === undefined) {
      const deducedValues = this.deduceOp1(instruction, dst, op0);

      const [deducedOp1, deducedRes] = deducedValues;
      if (deducedOp1 !== undefined) {
        this.segments.insert(op1Addr, deducedOp1);
      }
      if (res === undefined) {
        res = deducedRes;
      }
    }

    // If res is still undefined, then we can compute it from op0 and op1
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
        this.segments.insert(dstAddr, deducedDst);
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
  ): [MaybeRelocatable | undefined, MaybeRelocatable | undefined] {
    // We can deduce the first operand from the destination and the second
    // operand, based on which opcode is used.
    switch (instruction.opcode) {
      // If the opcode is a call, then the first operand can be found at pc
      // + instruction size.
      case Opcode.Call:
        const pc = this.runContext.pc;
        const deducedOp0 = pc.add(instruction.size());
        return [deducedOp0, undefined];
      // If the opcode is an assert eq, then we can deduce the first operand
      // based on the result logic. For add, res = op0 + op1. For mul,
      // res = op0 * op1. We also know that the result is the same as
      // the destination operand.
      case Opcode.AssertEq:
        switch (instruction.resLogic) {
          case ResLogic.Add:
            if (dst !== undefined && op1 !== undefined) {
              const deducedOp0 = dst.sub(op1);

              return [deducedOp0, dst];
            }
          case ResLogic.Mul:
            if (dst !== undefined && op1 !== undefined) {
              try {
                if (!Felt.isFelt(dst)) {
                  throw new Error();
                }
                const deducedOp0 = dst.div(op1);
                return [deducedOp0, dst];
              } catch (err) {
                return [undefined, undefined];
              }
            }
            break;
        }
      default:
        return [undefined, undefined];
    }
  }

  deduceOp1(
    instruction: Instruction,
    dst: MaybeRelocatable | undefined,
    op0: MaybeRelocatable | undefined
  ): [MaybeRelocatable | undefined, MaybeRelocatable | undefined] {
    if (instruction.opcode !== Opcode.AssertEq) {
      return [undefined, undefined];
    }
    // We can deduce the second operand from the destination and the first
    // operand, based on the result logic, only if the opcode is an assert eq
    // because this is the only opcode that allows us to assume dst = res.
    switch (instruction.resLogic) {
      // If the result logic is op1, then res = op1 = dst.
      case ResLogic.Op1:
        return [dst, dst];
      // If the result logic is add, then the second operand is the destination
      // operand subtracted from the first operand.
      case ResLogic.Add:
        if (dst !== undefined && op0 !== undefined) {
          const deducedOp1 = dst.sub(op0);

          return [deducedOp1, dst];
        }
        break;
      // If the result logic is mul, then the second operand is the destination
      // operand divided from the first operand.
      case ResLogic.Mul:
        if (dst !== undefined && op0 !== undefined) {
          try {
            if (!Felt.isFelt(dst)) {
              throw new Error();
            }
            const deducedOp1 = dst.div(op0);
            return [deducedOp1, dst];
          } catch (err) {
            return [undefined, undefined];
          }
        }
        break;
    }
    return [undefined, undefined];
  }

  // Compute the result of an instruction based on result logic
  // for the instruction.
  computeRes(
    instruction: Instruction,
    op0: MaybeRelocatable,
    op1: MaybeRelocatable
  ): MaybeRelocatable | undefined {
    switch (instruction.resLogic) {
      case ResLogic.Op1:
        return op1;
      case ResLogic.Add:
        return op0.add(op1);
      case ResLogic.Mul:
        if (!Felt.isFelt(op0)) {
          throw new VirtualMachineError(ExpectedFelt);
        }
        return op0.mul(op1);
      case ResLogic.Unconstrained:
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
      // As stated above, for an assert eq instruction, we have res = dst.
      case Opcode.AssertEq:
        return res;
      // For a call instruction, we have dst = fp.
      case Opcode.Call:
        return this.runContext.fp;
      default:
        return undefined;
    }
  }

  // Update the registers based on the instruction.
  updateRegisters(instruction: Instruction, operands: Operands): void {
    this.updatePc(instruction, operands);

    this.updateFp(instruction, operands);

    return this.updateAp(instruction, operands);
  }

  // Update the pc update logic based on the instruction.
  updatePc(instruction: Instruction, operands: Operands): void {
    switch (instruction.pcUpdate) {
      // If the pc update logic is regular, then we increment the pc by
      // the instruction size.
      case PcUpdate.Regular:
        this.runContext.incrementPc(instruction.size());
        break;
      // If the pc update logic is jump, then we set the pc to the
      // result.
      case PcUpdate.Jump:
        if (operands.res === undefined) {
          throw new VirtualMachineError(UnconstrainedResError);
        }
        if (!Relocatable.isRelocatable(operands.res)) {
          throw new VirtualMachineError(ExpectedRelocatable);
        }
        this.runContext.pc = operands.res;
        break;
      // If the pc update logic is jump rel, then we add the result
      // to the pc.
      case PcUpdate.JumpRel:
        if (operands.res === undefined) {
          throw new VirtualMachineError(UnconstrainedResError);
        }

        if (!Felt.isFelt(operands.res)) {
          throw new VirtualMachineError(ExpectedFelt);
        }
        this.runContext.pc = this.runContext.pc.add(operands.res);
        break;
      // If the pc update logic is jnz, then we check if the destination
      // is zero. If it is, then we increment the pc by the instruction (default)
      // If it is not, then we add the op1 to the pc.
      case PcUpdate.Jnz:
        if (operands.dst === undefined) {
          throw new VirtualMachineError(InvalidDstOperand);
        }
        if (Felt.isFelt(operands.dst) && operands.dst.eq(Felt.ZERO)) {
          this.runContext.incrementPc(instruction.size());
        } else {
          if (operands.op1 === undefined) {
            throw new VirtualMachineError(InvalidOperand1);
          }
          if (!Felt.isFelt(operands.op1)) {
            throw new VirtualMachineError(ExpectedFelt);
          }
          this.runContext.pc = this.runContext.pc.add(operands.op1);
        }
        break;
    }
  }

  // Update the fp based on the fp update logic of the instruction.
  updateFp(instruction: Instruction, operands: Operands): void {
    switch (instruction.fpUpdate) {
      // If the fp update logic is ap plus 2, then we add 2 to the ap
      case FpUpdate.ApPlus2:
        const apPlus2 = this.runContext.ap.add(2);

        this.runContext.fp = apPlus2;
        break;
      // If the fp update logic is dst, then we add the destination
      // to fp if dst is a felt, or set the fp to the destination
      // if a relocatable.
      case FpUpdate.Dst:
        if (operands.dst === undefined) {
          throw new VirtualMachineError(InvalidDstOperand);
        }
        if (Felt.isFelt(operands.dst)) {
          this.runContext.fp = this.runContext.fp.add(operands.dst);
        }
        if (Relocatable.isRelocatable(operands.dst)) {
          this.runContext.fp = operands.dst;
        }
        break;
    }
  }

  // Update the ap based on the ap update logic of the instruction.
  updateAp(instruction: Instruction, operands: Operands): void {
    switch (instruction.apUpdate) {
      // If the ap update logic is add, then we add the result to the ap.
      case ApUpdate.Add:
        if (operands.res === undefined) {
          throw new VirtualMachineError(UnconstrainedResError);
        }
        if (!Felt.isFelt(operands.res)) {
          throw new VirtualMachineError(ExpectedFelt);
        }

        this.runContext.ap = this.runContext.ap.add(operands.res);
        break;
      // If the ap update logic is add 1, then we add 1 to the ap.
      case ApUpdate.Add1:
        this.runContext.ap = this.runContext.ap.add(1);
        break;
      // If the ap update logic is add 2, then we add 2 to the ap.
      case ApUpdate.Add2:
        this.runContext.ap = this.runContext.ap.add(2);
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
      case Opcode.AssertEq:
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
      case Opcode.Call:
        const nextPc = this.runContext.pc.add(instruction.size());
        if (operands.op0 === undefined || !nextPc.eq(operands.op0)) {
          throw new VirtualMachineError(InvalidOperand0);
        }
        if (this.runContext.fp !== operands.dst) {
          throw new VirtualMachineError(InvalidDstOperand);
        }
        break;
    }
  }
}
