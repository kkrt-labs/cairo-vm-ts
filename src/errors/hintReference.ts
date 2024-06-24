class ReferenceError extends Error {}

export class InvalidReference extends ReferenceError {
  constructor(reference: string) {
    super(`Invalid reference ${reference}`);
  }
}

export class InvalidOffsetExpr extends ReferenceError {
  constructor(offsetExpr: string, reference: string) {
    super(`Invalid offset pattern ${offsetExpr} in reference ${reference}`);
  }
}
