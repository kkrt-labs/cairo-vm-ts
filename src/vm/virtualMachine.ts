import { MemorySegmentManager } from 'memory/memoryManager';
import { Felt } from 'primitives/felt';
import { Uint64, UnsignedInteger } from 'primitives/uint';
import { RunContext } from 'run-context/runContext';
import { Instruction, Opcode, ResLogic } from './instruction';
import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';

export class MemoryError extends Error {}

export const InstructionError =
  'VMError: VM Instruction must be a Field Element';

export const EndOfInstructionsError = 'VMError: reached end of instructions';

export class VirtualMachine {
  private runContext: RunContext;
  private currentStep: Uint64;
  private segments: MemorySegmentManager;

  constructor() {
    this.currentStep = UnsignedInteger.ZERO_UINT64;
    this.segments = new MemorySegmentManager();
    this.runContext = RunContext.default();
  }

  step(): void {
    const maybeEncodedInstruction = this.segments.memory.get(
      this.runContext.getPc()
    );

    if (maybeEncodedInstruction === undefined) {
      throw new MemoryError(EndOfInstructionsError);
    }

    const encodedInstruction = maybeEncodedInstruction;

    if (!(encodedInstruction instanceof Felt)) {
      throw new MemoryError(InstructionError);
    }

    const encodedInstructionUint = encodedInstruction.toUint64();
    // decode and run instruction
    const instruction = Instruction.decodeInstruction(encodedInstructionUint);

    // return this.runInstruction();
    throw new Error('TODO: Not Implemented');
  }

  // Compute the operands of an instruction. The VM can either
  // fetch them from memory and if it fails to do so, it can
  // deduce them from the instruction itself.
  computeOperands(instruction: Instruction) {
    // Compute the destination address based on the dstReg and
    // the offset
    const dstAddr = this.runContext.computeAddress(
      instruction.dstReg,
      instruction.offDst
    );
    const dst = this.segments.memory.get(dstAddr);

    // Compute the first operand address based on the op0Reg and
    // the offset
    const op0Addr = this.runContext.computeAddress(
      instruction.op0Reg,
      instruction.offOp0
    );
    const op0 = this.segments.memory.get(op0Addr);

    // Compute the second operand address based on the op1Src and
    // the offset
    const op1Addr = this.runContext.computeOp1Address(
      instruction.op1Src,
      instruction.offOp1,
      op0
    );
    const op1 = this.segments.memory.get(op1Addr);
  }

  deduceOp0(
    instruction: Instruction,
    dst: MaybeRelocatable | undefined,
    op1: MaybeRelocatable | undefined
  ): MaybeRelocatable | undefined {
    // We can deduce the first operand from the destination and the second
    // operand, based on which opcode is used.
    let op0: MaybeRelocatable;
    switch (instruction.opcode) {
      // If the opcode is a call, then the first operand can be found at pc
      // + instruction size.
      case Opcode.Call:
        try {
          op0 = this.runContext.getPc().add(instruction.size());
        } catch (e) {
          return undefined;
        }
        break;
      case Opcode.AssertEq:
        switch (instruction.resLogic) {
          case ResLogic.Add:
            if (dst === undefined || op1 === undefined) {
              return undefined;
            }
            try {
              op0 = dst.sub(op1);
            } catch {
              return undefined;
            }
            break;
        }
    }
  }

  // runInstruction(instruction: Instruction): Result<true, VMError> {}
}
