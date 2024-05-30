/** Errors related to builtins */
export class BuiltinError extends Error {}

/** Value cannot be infered from undefined cell value */
export class UndefinedValue extends BuiltinError {
  public readonly offset;

  constructor(offset: number) {
    super();
    this.offset = offset;
  }
}

/** Ladder formula R = P + mQ failed in EcOp builtin */
export class LadderFailed extends BuiltinError {}
