import { ResOperand } from 'hints/hintParamsSchema';
import { Relocatable } from 'primitives/relocatable';
import { SegmentValue } from 'primitives/segmentValue';

class VirtualMachineError extends Error {}

/** Instruction read from memory at `address` is undefined */
export class UndefinedInstruction extends VirtualMachineError {
  constructor(address: Relocatable) {
    super(`Instruction read from memory at ${address.toString()} is undefined`);
  }
}

/** Auxiliary value res is undefined */
export class UnusedRes extends VirtualMachineError {
  constructor() {
    super('Auxiliary value res is undefined');
  }
}

/** Invalid dst */
export class InvalidDst extends VirtualMachineError {
  constructor() {
    super('Invalid dst - dst is undefined');
  }
}

export class InvalidCallOp0Value extends VirtualMachineError {
  constructor(op0: SegmentValue, nextPc: Relocatable) {
    super(`op0 ${op0.toString()} should be equal to ${nextPc.toString()}`);
  }
}

/** Invalid op0, its value cannot determined from other values */
export class InvalidOp0 extends VirtualMachineError {
  constructor() {
    super('Cannot determine op0 value');
  }
}

/** op0 is undefined */
export class UndefinedOp0 extends VirtualMachineError {
  constructor() {
    super('op0 is undefined');
  }
}

/** Invalid op1, its value cannot determined from other values*/
export class InvalidOp1 extends VirtualMachineError {
  constructor() {
    super('Cannot determine op1 value');
  }
}

/** op0 is undefined */
export class UndefinedOp1 extends VirtualMachineError {
  constructor() {
    super('op1 is undefined');
  }
}

/** `resOperand` is not of a valid type to extract buffer from it. */
export class InvalidBufferResOp extends VirtualMachineError {
  constructor(resOperand: ResOperand) {
    super(`Cannot extract buffer from the given ResOperand: ${resOperand}`);
  }
}
