import { BaseError, ErrorType } from 'result/error';
import {
  Op0NotRelocatable,
  Op0Undefined,
  Op1ImmediateOffsetError,
} from 'result/runContext';
import { Int16 } from 'primitives/int';
import {
  ProgramCounter,
  Relocatable,
  MemoryPointer,
  MaybeRelocatable,
} from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Op1Src, RegisterFlag } from 'vm/instruction';
import { Result } from 'result/result';

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

  incrementPc(instructionSize: Uint32): Result<Relocatable> {
    return this.pc.add(instructionSize);
  }

  getPc() {
    return this.pc;
  }

  getFp() {
    return this.fp;
  }

  computeAddress(register: RegisterFlag, offset: Int16): Result<Relocatable> {
    switch (register) {
      case RegisterFlag.AP:
        return applyOffsetOnBaseAddress(this.ap, offset);

      case RegisterFlag.FP:
        return applyOffsetOnBaseAddress(this.fp, offset);
    }
  }

  computeOp1Address(
    op1Src: Op1Src,
    op1Offset: Int16,
    op0: MaybeRelocatable | undefined
  ): Result<Relocatable> {
    let baseAddr: Relocatable;
    switch (op1Src) {
      case Op1Src.AP:
        baseAddr = this.ap;
        break;
      case Op1Src.FP:
        baseAddr = this.fp;
        break;
      case Op1Src.Imm:
        if (op1Offset == 1) {
          baseAddr = this.pc;
        } else {
          return {
            value: undefined,
            error: new BaseError(
              ErrorType.RunContextError,
              Op1ImmediateOffsetError
            ),
          };
        }
        break;
      case Op1Src.Op0:
        if (op0 === undefined) {
          return {
            value: undefined,
            error: new BaseError(ErrorType.RunContextError, Op0Undefined),
          };
        }
        const reloc = Relocatable.getRelocatable(op0);
        if (reloc === undefined) {
          return {
            value: undefined,
            error: new BaseError(ErrorType.RunContextError, Op0NotRelocatable),
          };
        }
        baseAddr = reloc;
    }

    return applyOffsetOnBaseAddress(baseAddr, op1Offset);
  }
}

function applyOffsetOnBaseAddress(
  baseAddr: Relocatable,
  offset: Int16
): Result<Relocatable> {
  const offsetIsNegative = offset < 0 ? 1 : 0;

  const { value, error } = UnsignedInteger.toUint32(
    -1 * offsetIsNegative * offset + (1 - offsetIsNegative) * offset
  );
  if (error !== undefined) {
    return { value: undefined, error };
  }

  return offsetIsNegative ? baseAddr.sub(value) : baseAddr.add(value);
}
