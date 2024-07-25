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

/** The program builtins are not a subsequence of the builtins available in the chosen layout. */
export class UnorderedBuiltins extends CairoRunnerError {
  constructor(
    programBuiltins: string[],
    layoutBuiltins: string[],
    layout: string
  ) {
    super(
      `The program builtins are not a subsequence of the '${layout}' layout builtins.
Program builtins: ${programBuiltins.join(', ')}
Layout builtins: ${layoutBuiltins.join(', ')}`
    );
  }
}
