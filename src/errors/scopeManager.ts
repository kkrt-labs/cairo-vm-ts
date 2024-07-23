class ScopeManagerError extends Error {}

/** The main scope cannot be removed, there must always be at least one scope. */
export class CannotExitMainScope extends ScopeManagerError {
  constructor() {
    super('Cannot exit the main scope');
  }
}

/** The variable `name` is not accessible in the current scope. */
export class VariableNotInScope extends ScopeManagerError {
  constructor(name: string) {
    super(`Variable ${name} is not in scope`);
  }
}
