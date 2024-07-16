class ScopeManagerError extends Error {}

export class CannotExitMainScope extends ScopeManagerError {
  constructor() {
    super('Cannot exit the main scope');
  }
}

export class VariableNotInScope extends ScopeManagerError {
  constructor(name: string) {
    super(`Variable ${name} is not in scope`);
  }
}
