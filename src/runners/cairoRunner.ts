import { MaybeRelocatable, Relocatable } from 'primitives/relocatable';
import { UnsignedInteger } from 'primitives/uint';
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
  private mainOffset: number;

  constructor(program: Program) {
    this.program = program;
    const mainIdentifier = program.identifiers.get('__main__.main');
    let mainOffset = 0;
    if (mainIdentifier !== undefined && mainIdentifier.pc !== undefined) {
      UnsignedInteger.ensureUint32(mainIdentifier.pc);
      mainOffset = mainIdentifier.pc;
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
  initialize(): Relocatable {
    this.initializeSegments();
    const result = this.initializeMainEntrypoint();
    this.initializeVm();

    return result;
  }

  // Run until the given PC is reached.
  runUntilPc(end: Relocatable): void {
    while (this.vm.runContext.pc.getOffset() < end.getOffset()) {
      this.vm.step();
    }
  }

  // Initialize the program and execution segments.
  initializeSegments(): void {
    this.programBase = this.vm.segments.addSegment();
    this.executionBase = this.vm.segments.addSegment();
  }

  // Initialize the main entrypoint.
  initializeMainEntrypoint(): Relocatable {
    const stack: Relocatable[] = [];
    const return_fp = this.vm.segments.addSegment();
    return this.initializeFunctionEntrypoint(this.mainOffset, stack, return_fp);
  }

  // Initialize a function entrypoint.
  initializeFunctionEntrypoint(
    entrypoint: number,
    stack: Relocatable[],
    return_fp: Relocatable
  ): Relocatable {
    const finalPc = this.vm.segments.addSegment();
    stack.push(return_fp, finalPc);

    const initialFp = this.executionBase.add(stack.length);

    this.initialFp = initialFp;
    this.initialAp = initialFp;
    this.finalPc = finalPc;

    this.initializeState(entrypoint, stack);

    return finalPc;
  }

  // Initialize the runner state.
  initializeState(entrypoint: number, stack: Relocatable[]): void {
    this.initialPc = this.programBase.add(entrypoint);

    this.vm.segments.setData(this.programBase, this.program.data);

    this.vm.segments.setData(this.executionBase, stack);
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

  getMainOffset(): number {
    return this.mainOffset;
  }
}
