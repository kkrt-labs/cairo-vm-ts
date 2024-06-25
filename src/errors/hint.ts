class HintError extends Error {}

export class UnknownHint extends HintError {
  constructor(code: string) {
    super(`Unknown hint - ${code}`);
  }
}

export class UnreachableReference extends HintError {
  constructor(index: number) {
    super(`Cannot reach the reference ${index} in the reference manager`);
  }
}
export class EmptyVariableName extends HintError {
  constructor() {
    super(`The variable name string is empty`);
  }
}
