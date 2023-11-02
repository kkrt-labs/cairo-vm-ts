import { MemorySegmentManager } from 'memory/memoryManager';
import { Felt } from 'primitives/felt';
import { Uint64, UnsignedInteger } from 'primitives/uint';
import { RunContext } from 'run-context/runContext';
import { Instruction } from './instruction';

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

    const maybeUint = encodedInstruction.toUint64();
    // decode and run instruction
    // return this.runInstruction();
    throw new Error('TODO: Not Implemented');
  }

  computeOperands(instruction: Instruction) {}
}
