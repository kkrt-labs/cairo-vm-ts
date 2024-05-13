export class VirtualMachineError extends Error {}

/** End of instructions */
export class EndOfInstructionsError extends VirtualMachineError {}
/** Result is unconstrained */
export class UnconstrainedResError extends VirtualMachineError {}
/** Assert values are different */
export class DiffAssertValuesError extends VirtualMachineError {}
/** Invalid destination operand */
export class InvalidDstOperand extends VirtualMachineError {}
/** Invalid operation operand */
export class InvalidOp0Operand extends VirtualMachineError {}
/** Invalid operand 0 */
export class InvalidOp0 extends VirtualMachineError {}
/** Invalid operand 1 */
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
