import { Int16 } from 'primitives/int';
import {
  ProgramCounter,
  Relocatable,
  MemoryPointer,
  MaybeRelocatable,
} from 'primitives/relocatable';
import { Uint32, UnsignedInteger } from 'primitives/uint';
import { Op1Src, RegisterFlag } from 'vm/instruction';

export class RunContextError extends Error {}

export const PCError = 'RunContextError: cannot increment PC';
export const Op1ImmediateOffsetError =
  'RunContextError: Op1 immediate offset should be 1';
export const Op0NotRelocatable =
  'RunContextError: Op0 is not relocatable. Cannot compute Op1 address';
export const Op0Undefined = 'RunContextError: Op0 is undefined';

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

  computeAddress(register: RegisterFlag, offset: Int16): Relocatable {
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
  ): Relocatable {
    let baseAddr: Relocatable;
    switch (op1Src) {
      case Op1Src.AP:
        baseAddr = this.ap;
        break;
      case Op1Src.FP:
        baseAddr = this.fp;
        break;
      case Op1Src.Imm:
        // TODO: discuss if we want to move this to decode
        if (op1Offset == 1) {
          baseAddr = this.pc;
        } else {
          throw new RunContextError(Op1ImmediateOffsetError);
        }
        break;
      case Op1Src.Op0:
        if (op0 === undefined) {
          throw new RunContextError(Op0Undefined);
        }
        const reloc = Relocatable.getRelocatable(op0);
        if (reloc === undefined) {
          throw new RunContextError(Op0NotRelocatable);
        }
        baseAddr = reloc;
    }

    return applyOffsetOnBaseAddress(baseAddr, op1Offset);
  }
}

function applyOffsetOnBaseAddress(
  baseAddr: Relocatable,
  offset: Int16
): Relocatable {
  const offsetIsNegative = offset < 0 ? 1 : 0;

  const offsetAbs = UnsignedInteger.toUint32(
    -1 * offsetIsNegative * offset + (1 - offsetIsNegative) * offset
  );

  return offsetIsNegative ? baseAddr.sub(offsetAbs) : baseAddr.add(offsetAbs);
}
