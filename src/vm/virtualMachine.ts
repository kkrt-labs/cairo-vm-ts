import { MemorySegmentManager } from 'memory/memoryManager';
import { Felt } from 'primitives/felt';
import { Uint64, UnsignedInteger } from 'primitives/uint';
import { Result, Err, VMError } from 'result-pattern/result';
import { RunContext } from 'run-context/runContext';
import { Instruction } from './instruction';

export const InstructionError = {
  message: 'VMError: VM Instruction must be a Field Element',
};

export const EndOfInstructionsError = {
  message: 'VMError: reached end of instructions',
};

export class VirtualMachine {
  private runContext: RunContext;
  private currentStep: Uint64;
  private segments: MemorySegmentManager;

  constructor() {
    this.currentStep = UnsignedInteger.ZERO_UINT64;
    this.segments = new MemorySegmentManager();
    this.runContext = RunContext.default();
  }

  step(): Result<true, VMError> {
    const maybeEncodedInstruction = this.segments.memory.get(
      this.runContext.getPc()
    );

    if (maybeEncodedInstruction.isNone()) {
      return new Err(EndOfInstructionsError);
    }

    const encodedInstruction = maybeEncodedInstruction.unwrap();

    if (!(encodedInstruction instanceof Felt)) {
      return new Err(InstructionError);
    }

    const maybeUint = encodedInstruction.toUint64();
    if (maybeUint.isErr()) {
      return maybeUint;
    }

    // decode and run instruction
    // return this.runInstruction();
    throw new Error('TODO: Not Implemented');
  }

  computeOperands(instruction: Instruction) {}
}
