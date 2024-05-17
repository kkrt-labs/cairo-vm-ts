import * as fs from 'fs';

import { Relocatable } from 'primitives/relocatable';
import { VirtualMachine } from 'vm/virtualMachine';
import { Program } from 'vm/program';

export class CairoRunner {
  program: Program;
  vm: VirtualMachine;
  programBase: Relocatable;
  executionBase: Relocatable;
  initialPc: Relocatable;
  initialAp: Relocatable;
  initialFp: Relocatable;
  finalPc: Relocatable;
  mainOffset: number;

  constructor(program: Program) {
    this.program = program;
    const mainIdentifier = program.identifiers.get('__main__.main');
    const mainOffset =
      mainIdentifier !== undefined ? mainIdentifier.pc ?? 0 : 0;

    this.vm = new VirtualMachine();
    this.programBase = new Relocatable(0, 0);
    this.mainOffset = mainOffset;
    this.executionBase = this.vm.memory.addSegment();

    const returnFp = this.vm.memory.addSegment();
    this.finalPc = this.vm.memory.addSegment();
    const values = [returnFp, this.finalPc];

    this.initialFp = this.executionBase.add(values.length);
    this.initialAp = this.initialFp;

    this.initialPc = this.programBase.add(this.mainOffset);

    // Initialize the program segment.
    // This sets the bytecode of your Cairo program, at segment 0.
    this.vm.memory.setValues(this.programBase, this.program.data);

    // Initialize the execution segment.
    // This sets the initial values in Memory, at segment 1.
    this.vm.memory.setValues(this.executionBase, values);

    this.vm.ap = this.initialAp;
    this.vm.fp = this.initialFp;
    this.vm.pc = this.initialPc;
  }

  // Run until the given PC is reached.
  runUntilPc(
    finalPc: Relocatable,
    verbose?: boolean,
    printMemory?: boolean,
    printRelocatedMemory?: boolean
  ): void {
    while (this.vm.pc.offset < finalPc.offset) {
      this.vm.step();
      if (verbose) {
        console.log(`AP: ${this.vm.ap.toString}`);
        console.log(`FP: ${this.vm.fp.toString()}`);
        console.log(`PC: ${this.vm.pc.toString()}`);

        console.log(`[ap - 1]: ${this.vm.memory.get(this.vm.ap.sub(1))}`);
        console.log(`[fp]: ${this.vm.memory.get(this.vm.fp)}`);
      }
    }
    this.vm.relocate();

    if (printMemory) {
      console.log(this.vm.memory.toString());
    }
    if (printRelocatedMemory) {
      console.log(this.vm.relocatedMemoryToString());
    }
  }

  /** Export the trace little-endian encoded to a file */
  exportTrace(filename: string = 'encoded_trace') {
    const buffer = new ArrayBuffer((this.vm.relocatedTrace.length + 1) * 3 * 8);
    const view = new DataView(buffer);

    this.vm.relocatedTrace.forEach((entry, step) => {
      const byteOffset = step * 3 * 8;
      view.setBigUint64(byteOffset, entry.ap.toBigInt(), true);
      view.setBigUint64(byteOffset + 8, entry.fp.toBigInt(), true);
      view.setBigUint64(byteOffset + 2 * 8, entry.pc.toBigInt(), true);
    });

    fs.writeFile(filename, buffer, { flag: 'w+' }, (err) => {
      if (err) throw err;
    });
  }

  /** Export the relocated memory little-endian encoded to a file */
  exportMemory(filename: string = 'encoded_memory') {
    const buffer = new ArrayBuffer(this.vm.relocatedMemory.size * 5 * 8);
    const view = new DataView(buffer);

    this.vm.relocatedMemory.forEach((value, address) => {
      const byteOffset = (address - 1) * 5 * 8;
      view.setBigUint64(byteOffset, BigInt(address), true);
      view.setBigUint64(byteOffset + 8, value.toBigInt(), true);
    });

    fs.writeFile(filename, buffer, { flag: 'w+' }, (err) => {
      if (err) throw err;
    });
  }
}
