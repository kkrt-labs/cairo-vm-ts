import { Relocatable } from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Result, Err, VMError, Ok } from 'result-pattern/result';
import { DstRegister, Instruction, RegisterFlag } from 'vm/instruction';

export const PCError = {
  message: 'RunContextError: cannot increment PC',
};

export class RunContext {
  private pc: Relocatable;
  private ap: Relocatable;
  private fp: Relocatable;

  constructor() {
    this.ap = new Relocatable(0, 0);
    this.pc = new Relocatable(0, 0);
    this.fp = new Relocatable(0, 0);
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
    const offsetIsNegative = instruction.dstReg < 0 ? 1 : 0;

    const offDst = UnsignedInteger.toUint32(
      -1 * offsetIsNegative * instruction.dstReg +
        (1 - offsetIsNegative) * instruction.dstReg
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
