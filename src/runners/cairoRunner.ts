import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Result } from 'result/result';
import { Program } from 'vm/program';
import { VirtualMachine } from 'vm/virtualMachine';

export class CairoRunner {
  private program: Program;
  private vm: VirtualMachine;
  private programBase: Relocatable;
  private executionBase: Relocatable;
  private initialPc: Relocatable;
  private initialAp: Relocatable;
  private initialFp: Relocatable;
  private finalPc: Relocatable;
  private mainOffset: Uint32;

  constructor(program: Program) {
    this.program = program;
    const mainIdentifier = program.identifiers.get('__main__.main');
    let mainOffset = 0 as Uint32;
    if (mainIdentifier !== undefined && mainIdentifier.pc !== undefined) {
      const { value: offset, error } = UnsignedInteger.toUint32(
        mainIdentifier.pc
      );
      if (error !== undefined) {
        throw new Error('Invalid main offset');
      }
      mainOffset = offset;
    }

    this.vm = new VirtualMachine();
    this.programBase = new Relocatable(0, 0);
    this.executionBase = new Relocatable(0, 0);
    this.initialPc = new Relocatable(0, 0);
    this.initialAp = new Relocatable(0, 0);
    this.initialFp = new Relocatable(0, 0);
    this.finalPc = new Relocatable(0, 0);
    this.mainOffset = mainOffset;
  }

  // Initialize the runner with the program and stack.
  initialize(): Result<Relocatable> {
    this.initializeSegments();
    const result = this.initializeMainEntrypoint();
    this.initializeVm();

    return result;
  }

  // Run until the given PC is reached.
  runUntilPc(end: Relocatable): Result<void> {
    while (this.vm.runContext.pc.getOffset() < end.getOffset()) {
      const { error } = this.vm.step();
      if (error !== undefined) {
        return { value: undefined, error };
      }
    }
    return { value: undefined, error: undefined };
  }

  // Initialize the program and execution segments.
  initializeSegments(): void {
    this.programBase = this.vm.segments.addSegment();
    this.executionBase = this.vm.segments.addSegment();
  }

  // Initialize the main entrypoint.
  initializeMainEntrypoint(): Result<Relocatable> {
    const stack: Relocatable[] = [];
    const return_fp = this.vm.segments.addSegment();
    return this.initializeFunctionEntrypoint(this.mainOffset, stack, return_fp);
  }

  // Initialize a function entrypoint.
  initializeFunctionEntrypoint(
    entrypoint: Uint32,
    stack: Relocatable[],
    return_fp: Relocatable
  ): Result<Relocatable> {
    const end = this.vm.segments.addSegment();
    stack.push(return_fp, end);

    const { value: length, error: lengthError } = UnsignedInteger.toUint32(
      stack.length
    );
    if (lengthError !== undefined) {
      return { value: undefined, error: lengthError };
    }

    const { value: initialFp, error: executionBaseError } =
      this.executionBase.add(length);
    if (executionBaseError !== undefined) {
      return { value: undefined, error: executionBaseError };
    }

    this.initialFp = initialFp;
    this.initialAp = initialFp;
    this.finalPc = end;

    const { error: initializeStateError } = this.initializeState(
      entrypoint,
      stack
    );
    if (initializeStateError !== undefined) {
      return { value: undefined, error: initializeStateError };
    }

    return { value: end, error: undefined };
  }

  // Initialize the runner state.
  initializeState(entrypoint: Uint32, stack: Relocatable[]): Result<void> {
    this.initialPc = this.programBase;
    this.initialPc = this.initialPc.add(entrypoint).value;

    const { error: loadProgramError } = this.vm.segments.loadData(
      this.programBase,
      this.program.data
    );

    if (loadProgramError !== undefined) {
      return { value: undefined, error: loadProgramError };
    }

    const { error: loadStackError } = this.vm.segments.loadData(
      this.executionBase,
      stack
    );
    if (loadStackError !== undefined) {
      return { value: undefined, error: loadStackError };
    }

    return { value: undefined, error: undefined };
  }

  // Initialize the VM.
  initializeVm(): void {
    this.vm.runContext.ap = this.initialAp;
    this.vm.runContext.fp = this.initialFp;
    this.vm.runContext.pc = this.initialPc;
  }

  getVm(): VirtualMachine {
    return this.vm;
  }

  getProgramBase(): Relocatable {
    return this.programBase;
  }

  getExecutionBase(): Relocatable {
    return this.executionBase;
  }

  getInitialPc(): Relocatable {
    return this.initialPc;
  }

  getInitialAp(): Relocatable {
    return this.initialAp;
  }

  getInitialFp(): Relocatable {
    return this.initialFp;
  }

  getFinalPc(): Relocatable {
    return this.finalPc;
  }

  getMainOffset(): Uint32 {
    return this.mainOffset;
  }
}
