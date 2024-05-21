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
    printMemory?: boolean,
    printRelocatedMemory?: boolean
  ): void {
    while (!this.vm.pc.eq(finalPc)) {
      this.vm.step();
    }
    this.vm.relocate();
    if (printMemory) console.log(this.vm.memory.toString());
    if (printRelocatedMemory) console.log(this.vm.relocatedMemoryToString());
  }

  /** Export the trace little-endian encoded to a file */
  exportTrace(filename: string = 'encoded_trace') {
    const buffer = BigUint64Array.from(
      this.vm.relocatedTrace.flatMap(({ pc, ap, fp }) => [
        ap.toBigInt(),
        fp.toBigInt(),
        pc.toBigInt(),
      ])
    );

    fs.writeFile(filename, buffer, { flag: 'w+' }, (err) => {
      if (err) throw err;
    });
  }

  /** Export the relocated memory little-endian encoded to a file */
  exportMemory(filename: string = 'encoded_memory') {
    const buffer = BigUint64Array.from(
      this.vm.relocatedMemory
        .map(({ address, value }) => {
          return [BigInt(address), value.to64BitsWords()];
        })
        .flat(2)
    );

    fs.writeFile(filename, buffer, { flag: 'w+' }, (err) => {
      if (err) throw err;
    });
  }
}
