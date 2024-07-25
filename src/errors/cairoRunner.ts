class CairoRunnerError extends Error {}

/** The relocated memory is empty. It cannot be exported. */
export class EmptyRelocatedMemory extends CairoRunnerError {
  constructor() {
    super('Relocated memory is empty');
  }
}

/** The Cairo Zero hints are not supported. */
export class CairoZeroHintsNotSupported extends CairoRunnerError {
  constructor() {
    super('Cairo Zero hints are not supported yet.');
  }
}

/** The output serialization of Cairo programs is not supported. */
export class CairoOutputNotSupported extends CairoRunnerError {
  constructor() {
    super('The output serialization of Cairo programs is not supported yet.');
  }
}

/** The given entrypoint is not in the program, it cannot be executed. */
export class UndefinedEntrypoint extends CairoRunnerError {
  constructor(name: string) {
    super(`The function to be executed doesn't exist: ${name}`);
  }
}

/** The program builtins has builtins that are not available in the chosen layout. */
export class InvalidBuiltins extends CairoRunnerError {
  constructor(builtins: string[], layout: string) {
    super(
      `The program contains builtins that are not supported by the layout ${layout}: ${builtins.join(
        ', '
      )}. Choose another layout to execute this program.`
    );
  }
}

/** The program builtins are not ordered as a subsequence of the builtins available in the layout. */
export class UnorderedBuiltins extends CairoRunnerError {
  constructor() {
    super(
      'The program builtins are not in the right order. It must follow the layout order.'
    );
  }
}
