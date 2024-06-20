import { Relocatable } from 'primitives/relocatable';

export class VirtualMachineError extends Error {}

/** Instruction read from memory at `address` is undefined */
export class UndefinedInstruction extends VirtualMachineError {
  public readonly address: Relocatable;

  constructor(address: Relocatable) {
    super();
    this.address = address;
  }
}

/** Auxiliary value res is undefined */
export class UnusedRes extends VirtualMachineError {}

/** Invalid dst */
export class InvalidDst extends VirtualMachineError {}

/** Invalid op0 */
export class InvalidOp0 extends VirtualMachineError {}

/** Invalid op1 */
export class InvalidOp1 extends VirtualMachineError {}

/** Expected relocatable */
export class ExpectedRelocatable extends VirtualMachineError {}
