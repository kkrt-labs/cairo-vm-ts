import { ProgramCounter, Relocatable, VmPointer } from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Result, Err, VMError, Ok } from 'result-pattern/result';
import { Instruction, RegisterFlag } from 'vm/instruction';

export const PCError = {
  message: 'RunContextError: cannot increment PC',
};

export class RunContext {
  private pc: VmPointer;
  private ap: VmPointer;
  private fp: ProgramCounter;

  static default() {
    return new RunContext(0, 0, 0);
  }

  constructor(pc: number, ap: number, fp: number) {
    this.pc = new ProgramCounter(pc);
    this.ap = new VmPointer(ap);
    this.fp = new VmPointer(fp);
  }

  incrementPc(instructionSize: Uint32): Result<Relocatable, VMError> {
    const res = this.pc.add(instructionSize);
    if (res.isErr()) {
      return new Err(Err.composeErrors([res.unwrapErr(), PCError]));
    }

    return res;
  }

  getPc() {
    return this.pc;
  }

  computeDstAddress(instruction: Instruction): Result<Relocatable, VMError> {
    const offsetIsNegative = instruction.offDst < 0 ? 1 : 0;

    const offDst = UnsignedInteger.toUint32(
      -1 * offsetIsNegative * instruction.offDst +
        (1 - offsetIsNegative) * instruction.offDst
    );

    if (offDst.isErr()) {
      return offDst;
    }

    switch (instruction.dstReg) {
      case RegisterFlag.ApRegisterFlag:
        return offsetIsNegative
          ? this.ap.sub(offDst.unwrap())
          : this.ap.add(offDst.unwrap());

      case RegisterFlag.FpRegisterFlag:
        return offsetIsNegative
          ? this.fp.sub(offDst.unwrap())
          : this.fp.add(offDst.unwrap());
    }
  }
}
