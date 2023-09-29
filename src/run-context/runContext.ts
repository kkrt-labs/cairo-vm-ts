import { Relocatable } from 'primitives/relocatable';
import { Uint64 } from 'primitives/uint';
import { Result, Err, Ok, VMError } from 'result-pattern/result';

export const PCError = {
  message: 'RunContextError: cannot increment PC',
};

export class RunContext {
  private pc: Relocatable;
  private ap: Relocatable;
  private fp: Relocatable;

  constructor() {
    this.ap = new Relocatable(0n, 0n);
    this.pc = new Relocatable(0n, 0n);
    this.fp = new Relocatable(0n, 0n);
  }

  incrementPc(instructionSize: Uint64): Result<Relocatable, VMError> {
    const res = this.pc.add(instructionSize);
    if (res.isErr()) {
      return new Err(Err.composeErrors([res.unwrapErr(), PCError]));
    }

    return res;
  }

  getPc() {
    return this.pc;
  }
}
