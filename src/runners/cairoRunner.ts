import * as fs from 'fs';

import { Relocatable } from 'primitives/relocatable';
import { VirtualMachine } from 'vm/virtualMachine';
import { Program } from 'vm/program';
import { getBuiltin } from 'builtins/builtin';

/**
 * Configuration of the run
 * - relocate: Flag to relocate the memory and the trace
 * - relocateOffset: Start address of the relocated memory
 */
export type RunOptions = {
  relocate: boolean;
  relocateOffset: number;
};

export class CairoRunner {
  program: Program;
  vm: VirtualMachine;
  programBase: Relocatable;
  executionBase: Relocatable;
  finalPc: Relocatable;

  static readonly defaultRunOptions: RunOptions = {
    relocate: false,
    relocateOffset: 0,
  };

  constructor(program: Program) {
    this.program = program;
    const mainId = program.identifiers.get('__main__.main');
    const mainOffset = mainId !== undefined ? mainId.pc ?? 0 : 0;

    this.vm = new VirtualMachine();
    this.programBase = this.vm.memory.addSegment();
    this.executionBase = this.vm.memory.addSegment();

    const builtin_stack = program.builtins
      .map(getBuiltin)
      .map((builtin) => this.vm.memory.addSegment(builtin));
    const returnFp = this.vm.memory.addSegment();
    this.finalPc = this.vm.memory.addSegment();
    const stack = [...builtin_stack, returnFp, this.finalPc];

    this.vm.pc = this.programBase.add(mainOffset);
    this.vm.ap = this.executionBase.add(stack.length);
    this.vm.fp = this.vm.ap;

    this.vm.memory.setValues(this.programBase, this.program.data);
    this.vm.memory.setValues(this.executionBase, stack);
  }

  /**
   * Run the loaded program with the given config
   */
  run(config: RunOptions = CairoRunner.defaultRunOptions): void {
    while (!this.vm.pc.eq(this.finalPc)) {
      this.vm.step();
    }
    const { relocate, relocateOffset } = config;
    if (relocate) this.vm.relocate(relocateOffset);
  }

  /**
   * Export the trace little-endian encoded to a file
   *
   * @dev DataView must be used to enforce little-endianness
   */
  exportTrace(filename: string = 'encoded_trace') {
    const buffer = new ArrayBuffer(this.vm.relocatedTrace.length * 3 * 8);
    const view = new DataView(buffer);

    this.vm.relocatedTrace.forEach(({ pc, ap, fp }, step) => {
      const byteOffset = step * 3 * 8;
      view.setBigUint64(byteOffset, ap.toBigInt(), true);
      view.setBigUint64(byteOffset + 8, fp.toBigInt(), true);
      view.setBigUint64(byteOffset + 2 * 8, pc.toBigInt(), true);
    });

    fs.writeFileSync(filename, view, { flag: 'w+' });
  }

  /**
   * Export the relocated memory little-endian encoded to a file
   *
   * @dev DataView must be used to enforce little-endianness
   */
  exportMemory(filename: string = 'encoded_memory') {
    const buffer = new ArrayBuffer(this.vm.relocatedMemory.length * 5 * 8);
    const view = new DataView(buffer);

    this.vm.relocatedMemory.forEach(({ address, value }) => {
      const byteOffset = (address - 1) * 5 * 8;
      const valueAs64BitsWords = value.to64BitsWords();
      view.setBigUint64(byteOffset, BigInt(address), true);
      view.setBigUint64(byteOffset + 8, valueAs64BitsWords[0], true);
      view.setBigUint64(byteOffset + 2 * 8, valueAs64BitsWords[1], true);
      view.setBigUint64(byteOffset + 3 * 8, valueAs64BitsWords[2], true);
      view.setBigUint64(byteOffset + 4 * 8, valueAs64BitsWords[3], true);
    });

    fs.writeFileSync(filename, view, { flag: 'w+' });
  }

  getOutput() {
    const builtins = this.program.builtins;
    const outputIdx = builtins.findIndex((name) => name === 'output');
    return outputIdx >= 0 ? this.vm.memory.segments[outputIdx + 2] : [];
  }
}
