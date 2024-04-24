export class VirtualMachineError extends Error {}

export const EndOfInstructionsError = 'End of instructions';
export const UnconstrainedResError = 'Result is unconstrained';
export const DiffAssertValuesError = 'Assert values are different';
export const InvalidDstOperand = 'Invalid destination operand';
export const InvalidOp0 = 'Invalid operand 0';
export const InvalidOp1 = 'Invalid operand 1';
export const ExpectedRelocatable = 'Expected relocatable';
export const ExpectedFelt = 'Expected felt';

export const Op1ImmediateOffsetError = 'Op1 immediate offset should be 1';
export const Op0NotRelocatable =
  'Op0 is not relocatable. Cannot compute Op1 address';
export const Op0Undefined = 'Op0 is undefined';
