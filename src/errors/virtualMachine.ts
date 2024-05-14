export class VirtualMachineError extends Error {}

/** End of instructions */
export class EndOfInstructionsError extends VirtualMachineError {}

/** Result is unconstrained */
export class UnusedResError extends VirtualMachineError {}

/** Assert values are different */
export class DiffAssertValuesError extends VirtualMachineError {}

/** Invalid dst */
export class InvalidDst extends VirtualMachineError {}

/** Invalid op0 */
export class InvalidOp0 extends VirtualMachineError {}

/** Invalid op1 */
export class InvalidOp1 extends VirtualMachineError {}

/** Expected relocatable */
export class ExpectedRelocatable extends VirtualMachineError {}

/** Expected felt */
export class ExpectedFelt extends VirtualMachineError {}

/** Op1 immediate offset should be 1 */
export class Op1ImmediateOffsetError extends VirtualMachineError {}

/** Op0 is not relocatable. Cannot compute Op1 address */
export class Op0NotRelocatable extends VirtualMachineError {}

/** Op0 is undefined */
export class Op0Undefined extends VirtualMachineError {}
