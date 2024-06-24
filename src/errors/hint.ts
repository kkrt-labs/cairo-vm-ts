class HintError extends Error {}

export class UnknownHint extends HintError {
  constructor(code: string) {
    super(`Unknown hint - ${code}`);
  }
}
export class UnreachableReference extends HintError {
  constructor(index: number, refManagerLen: number) {
    super(
      `Cannot reach the reference ${index} as there is only ${refManagerLen} references`
    );
  }
}
