class HintError extends Error {}

export class UnknownHint extends HintError {
  constructor(code: string) {
    super(`Unknown hint - ${code}`);
  }
}
