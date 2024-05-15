export class VirtualMachineError extends Error {}

/** End of instructions */
export class UndefinedInstruction extends VirtualMachineError {}

/** Result is unconstrained */
export class UnusedResError extends VirtualMachineError {}

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
