export class VirtualMachineError extends Error {}

export const EndOfInstructionsError = 'End of instructions';
export const UnconstrainedResError = 'Result is unconstrained';
export const DiffAssertValuesError = 'Assert values are different';
export const InvalidResOperand = 'Invalid result operand';
export const InvalidDstOperand = 'Invalid destination operand';
export const InvalidOperand0 = 'Invalid operand 0';
export const InvalidOperand1 = 'Invalid operand 1';
export const ExpectedRelocatable = 'Expected relocatable';
export const ExpectedFelt = 'Expected felt';

export const PCError = 'Cannot increment PC';
export const Op1ImmediateOffsetError = 'Op1 immediate offset should be 1';
export const Op0NotRelocatable =
  'Op0 is not relocatable. Cannot compute Op1 address';
export const Op0Undefined = 'Op0 is undefined';
