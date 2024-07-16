class CairoRunnerError extends Error {}

export class EmptyRelocatedMemory extends CairoRunnerError {
  constructor() {
    super('Relocated memory is empty');
  }
}

export class CairoZeroHintsNotSupported extends CairoRunnerError {
  constructor() {
    super('Cairo Zero hints are not supported yet.');
  }
}

export class CairoOutputNotSupported extends CairoRunnerError {
  constructor() {
    super('The output serialization of Cairo programs is not supported yet.');
  }
}

export class UndefinedEntrypoint extends CairoRunnerError {
  constructor(name: string) {
    super(`The function to be executed doesn't exist: ${name}`);
  }
}
