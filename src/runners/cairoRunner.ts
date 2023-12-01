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

  // Initialize the runner with the program and values.
  initialize(): Relocatable {
    this.initializeSegments();
    const result = this.initializeMainEntrypoint();
    this.initializeVm();

    return result;
  }

  // Run until the given PC is reached.
  runUntilPc(finalPc: Relocatable, verbose: boolean = false): void {
    while (this.vm.pc.offset < finalPc.offset) {
      this.vm.step();
      if (verbose) {
        console.log(`AP: ${this.vm.ap.segment}:${this.vm.ap.offset}`);
        console.log(`FP: ${this.vm.fp.segment}:${this.vm.fp.offset}`);
        console.log(`PC: ${this.vm.pc.segment}:${this.vm.pc.offset}`);

        console.log(`[ap - 1]: ${this.vm.memory.get(this.vm.ap.sub(1))}`);
        console.log(`[fp]: ${this.vm.memory.get(this.vm.fp)}`);
      }
    }
  }

  // Initialize the program and execution segments (resp. segment 0 and 1) in memory.
  initializeSegments(): void {
    this.programBase = new Relocatable(0, 0);
    this.executionBase = this.vm.memory.addSegment();
  }

  // Initialize the main entrypoint.
  initializeMainEntrypoint(): Relocatable {
    const returnFp = this.vm.memory.addSegment();
    return this.initializeFunctionEntrypoint(this.mainOffset, returnFp);
  }

  // Initialize a function entrypoint.
  initializeFunctionEntrypoint(
    entrypoint: number,
    returnFp: Relocatable
  ): Relocatable {
    const finalPc = this.vm.memory.addSegment();
    const values = [returnFp, finalPc];

    this.initialFp = this.executionBase.add(values.length);
    this.initialAp = this.getInitialFp();
    this.finalPc = finalPc;

    this.initializeState(entrypoint, values);

    return finalPc;
  }

  // Initialize the runner state.
  initializeState(entrypoint: number, initialValues: Relocatable[]): void {
    this.initialPc = this.programBase.add(entrypoint);

    // Initialize the program segment.
    // This sets the bytecode of your Cairo program in Memory, at segment 0.
    this.vm.memory.setData(this.programBase, this.program.data);

    // Initialize the execution segment.
    // This sets the initial values in Memory, at segment 1.
    this.vm.memory.setData(this.executionBase, initialValues);
  }

  // Initialize the VM.
  initializeVm(): void {
    this.vm.ap = this.initialAp;
    this.vm.fp = this.initialFp;
    this.vm.pc = this.initialPc;
  }

  getVm(): VirtualMachine {
    return this.vm;
  }

  getProgramBase(): Relocatable {
    return new Relocatable(this.programBase.segment, this.programBase.offset);
  }

  getExecutionBase(): Relocatable {
    return new Relocatable(
      this.executionBase.segment,
      this.executionBase.offset
    );
  }

  getInitialPc(): Relocatable {
    return new Relocatable(this.initialPc.segment, this.initialPc.offset);
  }

  getInitialAp(): Relocatable {
    return new Relocatable(this.initialAp.segment, this.initialAp.offset);
  }

  getInitialFp(): Relocatable {
    return new Relocatable(this.initialFp.segment, this.initialFp.offset);
  }

  getFinalPc(): Relocatable {
    return new Relocatable(this.finalPc.segment, this.finalPc.offset);
  }

  getMainOffset(): number {
    return this.mainOffset;
  }
}
