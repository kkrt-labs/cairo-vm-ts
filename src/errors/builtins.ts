/** Errors related to builtins */
export class BuiltinError extends Error {}

/** Value cannot be infered from the given cell of the builtin segment */
export class CannotInferValue extends BuiltinError {
  public readonly offset: number;

  constructor(offset: number) {
    super();
    this.offset = offset;
  }
}

/** Value cannot be infered from undefined cell value */
export class UndefinedValue extends BuiltinError {
  public readonly offset;

  constructor(offset: number) {
    super();
    this.offset = offset;
  }
}
