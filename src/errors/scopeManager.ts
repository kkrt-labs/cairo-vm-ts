class ScopeManager extends Error {}

export class CannotExitMainScope extends ScopeManager {
  constructor() {
    super('Cannot exit the main scope');
  }
}

export class VariableNotInScope extends ScopeManager {
  constructor(name: string) {
    super(`Variable ${name} is not in scope`);
  }
}
