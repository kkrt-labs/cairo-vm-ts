import { MemorySegmentManager } from 'memory/memory';
import { Felt } from 'primitives/felt';
import { Uint64, UnsignedInteger } from 'primitives/uint';
import { Result, Err, VMError } from 'result-pattern/result';
import { RunContext } from 'run-context/runContext';

export const InstructionError = {
  message: 'VMError: VM Instruction must be a Field Element',
};

export class VirtualMachine {
  private runContext: RunContext;
  private currentStep: Uint64;
  private segments: MemorySegmentManager;

  constructor() {
    this.currentStep = UnsignedInteger.toUint64(0n);
    this.segments = new MemorySegmentManager();
    this.runContext = new RunContext();
  }

  step(): Result<true, VMError> {
    const maybeEncodedInstruction = this.segments.memory.get(
      this.runContext.getPc()
    );

    if (maybeEncodedInstruction.isErr()) {
      return maybeEncodedInstruction;
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
}
