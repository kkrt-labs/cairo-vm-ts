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

/** The given entrypoint is not in the program, it cannot be executed. */
export class UndefinedEntrypoint extends CairoRunnerError {
  constructor(name: string) {
    super(`The entrypoint to be executed doesn't exist: ${name}`);
  }
}

/** The program builtins are not a subsequence of the builtins available in the chosen layout. */
export class InvalidBuiltins extends CairoRunnerError {
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

/**
 * The label `__main__.__end__` must be in the compilation artifacts
 * to run a Cairo Zero program in proof mode.
 */
export class MissingEndLabel extends CairoRunnerError {
  constructor() {
    super(`Label __end__ not found in program.`);
  }
}
