export class RunContextError extends Error {}

export const PCError = 'Cannot increment PC';
export const Op1ImmediateOffsetError = 'Op1 immediate offset should be 1';
export const Op0NotRelocatable =
  'Op0 is not relocatable. Cannot compute Op1 address';
export const Op0Undefined = 'Op0 is undefined';
