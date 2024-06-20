/** Errors related to builtins */
class BuiltinError extends Error {}

/** Value cannot be infered from undefined cell value */
export class UndefinedValue extends BuiltinError {
  public readonly offset;

  constructor(offset: number) {
    super();
    this.offset = offset;
  }
}

/** Value is above Range Check upper bound */
export class RangeCheckOutOfBounds extends BuiltinError {}

/** ECDSA signature cannot be retrived from dictionnary at `offset` */
export class UndefinedECDSASignature extends BuiltinError {
  constructor(readonly offset: number) {
    super();
    this.offset = offset;
  }
}

/** The ECDSA verification of the signature has failed */
export class InvalidSignature extends BuiltinError {}

/** The signature dictionnary is undefined */
export class UndefinedSignatureDict extends BuiltinError {}

/** An offset of type number is expected */
export class ExpectedOffset extends BuiltinError {}

/** Ladder formula R = P + mQ failed in EcOp builtin */
export class LadderFailed extends BuiltinError {}
