import * as fs from 'fs';

import { Relocatable } from 'primitives/relocatable';
import { VirtualMachine } from 'vm/virtualMachine';
import { Program } from 'vm/program';

export class CairoRunner {
  program: Program;
  vm: VirtualMachine;
  programBase: Relocatable;
  executionBase: Relocatable;
  finalPc: Relocatable;
  mainOffset: number;

  constructor(program: Program) {
    this.program = program;
    const mainIdentifier = program.identifiers.get('__main__.main');
    this.mainOffset = mainIdentifier !== undefined ? mainIdentifier.pc ?? 0 : 0;

    this.vm = new VirtualMachine();
    this.programBase = this.vm.memory.addSegment();
    this.executionBase = this.vm.memory.addSegment();

    const returnFp = this.vm.memory.addSegment();
    this.finalPc = this.vm.memory.addSegment();
    const values = [returnFp, this.finalPc];

    this.vm.pc = this.programBase.add(this.mainOffset);
    this.vm.ap = this.executionBase.add(values.length);
    this.vm.fp = this.vm.ap;

    this.vm.memory.setValues(this.programBase, this.program.data);
    this.vm.memory.setValues(this.executionBase, values);
  }
  // Run until the given PC is reached.
  runUntilPc(
    finalPc: Relocatable,
    relocate?: boolean,
    relocateOffset: number = 0,
    printMemory?: boolean,
    printRelocatedMemory?: boolean
  ): void {
    while (!this.vm.pc.eq(finalPc)) {
      this.vm.step();
    }
    if (relocate) this.vm.relocate(relocateOffset);
    if (printMemory) console.log(this.vm.memory.toString());
    if (printRelocatedMemory) console.log(this.vm.relocatedMemoryToString());
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

    fs.writeFile(filename, buffer, { flag: 'w+' }, (err) => {
      if (err) throw err;
    });
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

    fs.writeFile(filename, buffer, { flag: 'w+' }, (err) => {
      if (err) throw err;
    });
  }
}
