class CairoRunnerError extends Error {}

export class EmptyRelocatedMemory extends CairoRunnerError {}

export class CairoZeroHintsNotSupported extends CairoRunnerError {}

export class UndefinedEntrypoint extends CairoRunnerError {
  constructor(name: string) {
    super(`The function to be executed doesn't exist: ${name}`);
  }
}
