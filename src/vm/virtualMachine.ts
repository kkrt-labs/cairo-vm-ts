import { MemorySegmentManager } from 'memory/memoryManager';
import { Felt } from 'primitives/felt';
import { Uint64, UnsignedInteger } from 'primitives/uint';
import { RunContext } from 'run-context/runContext';
import { Instruction, Opcode, ResLogic } from './instruction';
import { MaybeRelocatable } from 'primitives/relocatable';
import { BaseError, ErrorType } from 'result/error';
import { EndOfInstructionsError, InstructionError } from 'result/memory';
import { Result } from 'result/result';

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
      throw new BaseError(ErrorType.MemoryError, EndOfInstructionsError);
    }

    const encodedInstruction = maybeEncodedInstruction;

    if (!(encodedInstruction instanceof Felt)) {
      throw new BaseError(ErrorType.MemoryError, InstructionError);
    }

    const { value: encodedInstructionUint, error } =
      encodedInstruction.toUint64();
    if (error !== undefined) {
      throw error;
    }
    // decode and run instruction
    const instruction = Instruction.decodeInstruction(encodedInstructionUint);

    // return this.runInstruction();
    throw new Error('TODO: Not Implemented');
  }

  // Compute the operands of an instruction. The VM can either
  // fetch them from memory and if it fails to do so, it can
  // deduce them from the instruction itself.
  computeOperands(instruction: Instruction): Result<void> {
    // Compute the destination address based on the dstReg and
    // the offset
    const { value: dstAddr, error: dstError } = this.runContext.computeAddress(
      instruction.dstReg,
      instruction.offDst
    );
    if (dstError !== undefined) {
      return { value: undefined, error: dstError };
    }
    const dst = this.segments.memory.get(dstAddr);

    // Compute the first operand address based on the op0Reg and
    // the offset
    const { value: op0Addr, error: op0Error } = this.runContext.computeAddress(
      instruction.op0Reg,
      instruction.offOp0
    );
    if (op0Error !== undefined) {
      return { value: undefined, error: op0Error };
    }
    const op0 = this.segments.memory.get(op0Addr);

    // Compute the second operand address based on the op1Src and
    // the offset
    const { value: op1Addr, error: op1Error } =
      this.runContext.computeOp1Address(
        instruction.op1Src,
        instruction.offOp1,
        op0
      );
    if (op1Error !== undefined) {
      return { value: undefined, error: op1Error };
    }
    const op1 = this.segments.memory.get(op1Addr);

    return { value: undefined, error: undefined };
  }

  // Deduce the operands of an instruction based on the instruction
  // itself. Deduces op0 and result when possible.
  deduceOp0(
    instruction: Instruction,
    dst: MaybeRelocatable | undefined,
    op1: MaybeRelocatable | undefined
  ): Result<[MaybeRelocatable | undefined, MaybeRelocatable | undefined]> {
    // We can deduce the first operand from the destination and the second
    // operand, based on which opcode is used.
    switch (instruction.opcode) {
      // If the opcode is a call, then the first operand can be found at pc
      // + instruction size.
      case Opcode.Call:
        const pc = this.runContext.getPc();
        const { value, error } = pc.add(instruction.size());
        if (error !== undefined) {
          return { value: undefined, error };
        }
        return { value: [value, undefined], error: undefined };
      // If the opcode is an assert eq, then we can deduce the first operand
      // based on the result logic.
      case Opcode.AssertEq:
        switch (instruction.resLogic) {
          case ResLogic.Add:
            if (dst !== undefined && op1 !== undefined) {
              const { value, error } = dst.sub(op1);
              if (error !== undefined) {
                return { value: undefined, error };
              }
              return { value: [value, dst], error: undefined };
            }
          case ResLogic.Mul:
            if (dst !== undefined && op1 !== undefined) {
              const { value, error } = dst.div(op1);
              if (error !== undefined) {
                return { value: [undefined, undefined], error: undefined };
              }
              return { value: [value, dst], error: undefined };
            }
            break;
        }
    }
    return { value: [undefined, undefined], error: undefined };
  }

  // runInstruction(instruction: Instruction): Result<true, VMError> {}
}
