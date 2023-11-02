import {
  ProgramCounter,
  Relocatable,
  MemoryPointer,
} from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Instruction, RegisterFlag } from 'vm/instruction';

export const PCError = {
  message: 'RunContextError: cannot increment PC',
};

export class RunContext {
  private pc: ProgramCounter;
  private ap: MemoryPointer;
  private fp: MemoryPointer;

  static default() {
    return new RunContext(0, 0, 0);
  }

  constructor(pc: number, ap: number, fp: number) {
    this.pc = new ProgramCounter(pc);
    this.ap = new MemoryPointer(ap);
    this.fp = new MemoryPointer(fp);
  }

  incrementPc(instructionSize: Uint32): Relocatable {
    return this.pc.add(instructionSize);
  }

  getPc() {
    return this.pc;
  }

  computeDstAddress(instruction: Instruction): Relocatable {
    const offsetIsNegative = instruction.offDst < 0 ? 1 : 0;

    const offDst = UnsignedInteger.toUint32(
      -1 * offsetIsNegative * instruction.offDst +
        (1 - offsetIsNegative) * instruction.offDst
    );

    switch (instruction.dstReg) {
      case RegisterFlag.AP:
        return offsetIsNegative ? this.ap.sub(offDst) : this.ap.add(offDst);

      case RegisterFlag.FP:
        return offsetIsNegative ? this.fp.sub(offDst) : this.fp.add(offDst);
    }
  }
}
